import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { DatabaseEngine } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { runContainer } from "@/lib/docker";
import { encryptSecret } from "@/lib/crypto";
import { isNeonConfigured, createNeonDatabase } from "@/lib/neon";
import {
  authenticateRequest,
  handleApiError,
  verifyAppOwnership,
  ApiError,
} from "@/lib/auth-middleware";

const createDatabaseSchema = z.object({
  applicationId: z.string().min(1, "applicationId is required"),
  engine: z.enum(["POSTGRES", "MYSQL", "REDIS", "MONGODB"]),
});

const ENGINE_CONFIGS: Record<
  DatabaseEngine,
  {
    image: string;
    port: number;
    user: string;
    dbName: string;
    getEnv: (user: string, pass: string, db: string) => Record<string, string>;
    getConnectionUrl: (
      user: string,
      pass: string,
      host: string,
      port: number,
      db: string
    ) => string;
  }
> = {
  POSTGRES: {
    image: "postgres:17-alpine",
    port: 5432,
    user: "ShipLane",
    dbName: "ShipLane_db",
    getEnv: (u, p, d) => ({
      POSTGRES_USER: u,
      POSTGRES_PASSWORD: p,
      POSTGRES_DB: d,
    }),
    getConnectionUrl: (u, p, h, port, d) =>
      `postgresql://${u}:${encodeURIComponent(p)}@${h}:${port}/${d}`,
  },
  MYSQL: {
    image: "mysql:8.0",
    port: 3306,
    user: "ShipLane",
    dbName: "ShipLane_db",
    getEnv: (u, p, d) => ({
      MYSQL_USER: u,
      MYSQL_PASSWORD: p,
      MYSQL_ROOT_PASSWORD: p,
      MYSQL_DATABASE: d,
    }),
    getConnectionUrl: (u, p, h, port, d) =>
      `mysql://${u}:${encodeURIComponent(p)}@${h}:${port}/${d}`,
  },
  REDIS: {
    image: "redis:7-alpine",
    port: 6379,
    user: "default",
    dbName: "0",
    getEnv: (u, p) => ({
      REDIS_PASSWORD: p,
    }),
    getConnectionUrl: (u, p, h, port) =>
      `redis://:${encodeURIComponent(p)}@${h}:${port}`,
  },
  MONGODB: {
    image: "mongo:7.0",
    port: 27017,
    user: "ShipLane",
    dbName: "ShipLane_db",
    getEnv: (u, p, d) => ({
      MONGO_INITDB_ROOT_USERNAME: u,
      MONGO_INITDB_ROOT_PASSWORD: p,
      MONGO_INITDB_DATABASE: d,
    }),
    getConnectionUrl: (u, p, h, port, d) =>
      `mongodb://${u}:${encodeURIComponent(p)}@${h}:${port}/${d}?authSource=admin`,
  },
};

/**
 * Background async worker logic to provision database container
 */
async function provisionDatabase(
  instanceId: string,
  applicationId: string,
  engine: DatabaseEngine
) {
  try {
    const config = ENGINE_CONFIGS[engine];
    const password = crypto.randomBytes(16).toString("hex");
    const containerName = `nebula-db-${engine.toLowerCase()}-${instanceId.slice(-8).toLowerCase()}`;
    let containerId: string | null = null;
    let host = containerName;
    let port = config.port;
    let user = config.user;
    let dbName = config.dbName;
    let finalPassword = password;
    let connectionUrl = config.getConnectionUrl(user, finalPassword, host, port, dbName);

    if (engine === "POSTGRES" && isNeonConfigured()) {
      try {
        const app = await prisma.application.findUnique({ where: { id: applicationId } });
        const neon = await createNeonDatabase(app?.name || applicationId);
        containerId = `neon:${neon.projectId}`;
        host = neon.host;
        port = neon.port;
        user = neon.user;
        dbName = neon.database;
        finalPassword = neon.password;
        connectionUrl = neon.connectionUri;
      } catch (neonErr) {
        console.warn("[Neon] Fallback to container:", neonErr);
      }
    }

    if (!containerId) {
      containerId = await runContainer({
        image: config.image,
        name: containerName,
        port: config.port,
        network: `nebula-net-${applicationId.toLowerCase()}`,
        labels: {
          "nebula.managed": "true",
          "nebula.appId": applicationId,
          "nebula.dbId": instanceId,
          "nebula.engine": engine,
        },
        env: config.getEnv(user, finalPassword, dbName),
      });
    }

    const encryptedPass = JSON.stringify(encryptSecret(finalPassword));

    // Update database instance record
    await prisma.databaseInstance.update({
      where: { id: instanceId },
      data: {
        status: "RUNNING",
        containerId,
        host,
        port,
        username: user,
        databaseName: dbName,
        encryptedPassword: encryptedPass,
      },
    });

    // Auto-inject DATABASE_URL into application's environment variables
    const encryptedConn = encryptSecret(connectionUrl);
    await prisma.environmentVariable.upsert({
      where: {
        applicationId_name: {
          applicationId,
          name: "DATABASE_URL",
        },
      },
      update: {
        encryptedValue: encryptedConn.ciphertext,
        iv: encryptedConn.iv,
        authTag: encryptedConn.authTag,
        source: "PLATFORM_MANAGED",
      },
      create: {
        applicationId,
        name: "DATABASE_URL",
        encryptedValue: encryptedConn.ciphertext,
        iv: encryptedConn.iv,
        authTag: encryptedConn.authTag,
        source: "PLATFORM_MANAGED",
      },
    });

    console.log(
      `[Databases] Successfully provisioned ${engine} for app ${applicationId} (${instanceId})`
    );
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Databases] Provisioning failed for ${instanceId}:`, err);
    await prisma.databaseInstance.update({
      where: { id: instanceId },
      data: {
        status: "STOPPED",
      },
    }).catch(() => {});
  }
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      throw new ApiError("applicationId query parameter is required", "MISSING_FIELD", 400);
    }

    await verifyAppOwnership(applicationId, auth.accountId);

    const databases = await prisma.databaseInstance.findMany({
      where: {
        applicationId,
        status: { not: "DELETED" },
      },
      select: {
        id: true,
        engine: true,
        status: true,
        databaseName: true,
        host: true,
        port: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ databases }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const body = await request.json().catch(() => ({}));
    const parsed = createDatabaseSchema.parse(body);

    await verifyAppOwnership(parsed.applicationId, auth.accountId);

    const instance = await prisma.databaseInstance.create({
      data: {
        applicationId: parsed.applicationId,
        engine: parsed.engine,
        status: "PROVISIONING",
      },
    });

    // Trigger provisioning in background
    setImmediate(() => {
      provisionDatabase(instance.id, parsed.applicationId, parsed.engine);
    });

    return NextResponse.json(
      {
        id: instance.id,
        status: "provisioning",
      },
      { status: 202 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

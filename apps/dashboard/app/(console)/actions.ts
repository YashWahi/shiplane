"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DatabaseEngine } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { queueDeploymentJob } from "@/lib/queue";
import { encryptSecret } from "@/lib/crypto";
import { runContainer, stopAndRemoveContainer } from "@/lib/docker";
import { uploadBuffer } from "@/lib/storage";
import { normalizeDeploymentArchive } from "@/lib/archive";
import { isNeonConfigured, createNeonDatabase } from "@/lib/neon";

class ActionError extends Error {}

function actionFailure(action: string, error: unknown, fallback: string) {
  const errorType = error instanceof Error ? error.name : typeof error;
  console.error(`[actions.${action}] Failed (${errorType}).`);
  return error instanceof ActionError ? error.message : fallback;
}

function githubRepositoryUrl(repository: string): string | null {
  const value = repository.trim();
  const shortName = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(value);
  if (shortName) return `https://github.com/${shortName[1]}/${shortName[2]}.git`;
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(url.pathname) &&
      !url.username &&
      !url.password
    ) {
      return url.pathname.endsWith(".git") ? url.toString() : `${url.toString()}.git`;
    }
  } catch {
    return null;
  }
  return null;
}

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
    user: "nebula",
    dbName: "nebula_db",
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
    user: "nebula",
    dbName: "nebula_db",
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
    user: "nebula",
    dbName: "nebula_db",
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
 * Authentication and app ownership verification helper.
 */
async function verifyUserAndApp(appId: string) {
  const session = await getServerSession(authOptions);
  const accountId = (session?.user as { id?: string } | undefined)?.id;
  if (!accountId) {
    throw new ActionError("Please sign in to manage applications.");
  }

  const app = await prisma.application.findFirst({
    where: { id: appId, accountId, status: { not: "deleted" } },
  });

  if (!app) {
    throw new ActionError("Application not found or you do not have access.");
  }

  return app;
}

/**
 * Trigger deployment for the specified application from GitHub.
 */
export async function deployApp(appId: string, repositoryInput?: string) {
  try {
    const app = await verifyUserAndApp(appId);
    let repositoryUrl = app.repository ? githubRepositoryUrl(app.repository) : null;
    if (repositoryInput) {
      const normalized = githubRepositoryUrl(repositoryInput);
      if (!normalized) {
        throw new ActionError("Please provide a valid GitHub repository (owner/repo or https URL).");
      }
      repositoryUrl = normalized;
      await prisma.application.update({
        where: { id: appId },
        data: { repository: normalized, sourceType: "git" },
      });
    }

    if (!repositoryUrl) {
      throw new ActionError("Connect a public GitHub repository before deploying from the dashboard.");
    }

    const sourceHash = crypto.randomBytes(16).toString("hex");

    const deployment = await prisma.deployment.create({
      data: {
        applicationId: appId,
        sourceHash,
        commitMessage: "Manual deployment via Dashboard (GitHub)",
        status: "QUEUED",
        currentStep: "QUEUED",
      },
    });

    await prisma.application.update({
      where: { id: appId },
      data: { status: "deploying" },
    });

    try {
      await queueDeploymentJob(appId, deployment.id, repositoryUrl);
    } catch {
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: "FAILED",
          currentStep: null,
          failedStep: "QUEUED",
          errorSummary: "The deployment could not be added to the worker queue.",
          finishedAt: new Date(),
        },
      });
      await prisma.application.update({
        where: { id: appId },
        data: { status: app.status },
      });
      throw new ActionError("The deployment could not be queued. Please retry.");
    }

    revalidatePath(`/apps/${appId}`);
    revalidatePath("/apps");

    return { success: true, deploymentId: deployment.id };
  } catch (error) {
    return { success: false, error: actionFailure("deployApp", error, "Could not start deployment.") };
  }
}

/**
 * Trigger deployment from an uploaded ZIP or tar.gz archive.
 */
export async function deployArchive(appId: string, formData: FormData) {
  try {
    const app = await verifyUserAndApp(appId);
    const file = formData.get("archive");
    if (!file || !(file instanceof Blob) || file.size === 0) {
      throw new ActionError("Please select a .zip or .tar.gz archive file.");
    }
    if (file.size > 100 * 1024 * 1024) {
      throw new ActionError("Archive file exceeds the 100MB limit.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const normalizedBuffer = await normalizeDeploymentArchive(Buffer.from(arrayBuffer));
    const sourceHash = crypto.createHash("sha256").update(normalizedBuffer).digest("hex");

    const deployment = await prisma.deployment.create({
      data: {
        applicationId: appId,
        sourceHash,
        commitMessage: `Manual ZIP upload (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
        status: "QUEUED",
        currentStep: "QUEUED",
      },
    });

    const minioObjectKey = `deployments/${appId}/${deployment.id}.tar.gz`;
    await uploadBuffer(minioObjectKey, normalizedBuffer, "application/gzip");

    await prisma.application.update({
      where: { id: appId },
      data: { status: "deploying", sourceType: "archive" },
    });

    try {
      await queueDeploymentJob(appId, deployment.id, minioObjectKey);
    } catch {
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: "FAILED",
          currentStep: null,
          failedStep: "QUEUED",
          errorSummary: "The deployment could not be added to the worker queue.",
          finishedAt: new Date(),
        },
      });
      await prisma.application.update({
        where: { id: appId },
        data: { status: app.status },
      });
      throw new ActionError("The deployment could not be queued. Please retry.");
    }

    revalidatePath(`/apps/${appId}`);
    revalidatePath("/apps");

    return { success: true, deploymentId: deployment.id };
  } catch (error) {
    return { success: false, error: actionFailure("deployArchive", error, "Could not deploy archive.") };
  }
}

/**
 * Create and provision a new database instance for the application.
 */
export async function createDatabase(appId: string, engine: string) {
  try {
    const app = await verifyUserAndApp(appId);

    const validEngines: DatabaseEngine[] = ["POSTGRES", "MYSQL", "REDIS", "MONGODB"];
    const normalizedEngine = engine.toUpperCase() as DatabaseEngine;
    if (!validEngines.includes(normalizedEngine)) {
      throw new Error(`Unsupported database engine: ${engine}`);
    }

    const config = ENGINE_CONFIGS[normalizedEngine];
    const password = crypto.randomBytes(16).toString("hex");

    const instance = await prisma.databaseInstance.create({
      data: {
        applicationId: appId,
        engine: normalizedEngine,
        status: "PROVISIONING",
      },
    });

    const cleanAppId = appId.toLowerCase();
    const containerName = `nebula-db-${normalizedEngine.toLowerCase()}-${instance.id.slice(-8).toLowerCase()}`;
    let containerId: string | null = null;
    let host = containerName;
    let port = config.port;
    let user = config.user;
    let dbName = config.dbName;
    let finalPassword = password;
    let connectionUrl = config.getConnectionUrl(user, finalPassword, host, port, dbName);

    // If Postgres and Neon API is configured, provision a cloud serverless Neon DB!
    if (normalizedEngine === "POSTGRES" && isNeonConfigured()) {
      try {
        console.log(`[Neon] Provisioning serverless PostgreSQL database for app: ${app.name}...`);
        const neon = await createNeonDatabase(app.name);
        containerId = `neon:${neon.projectId}`;
        host = neon.host;
        port = neon.port;
        user = neon.user;
        dbName = neon.database;
        finalPassword = neon.password;
        connectionUrl = neon.connectionUri;
        console.log(`[Neon] Serverless DB ready: ${host}/${dbName}`);
      } catch (neonErr) {
        console.warn("[Neon] Failed to provision Neon database, falling back to local container:", neonErr);
      }
    }

    if (!containerId) {
      try {
        containerId = await runContainer({
          image: config.image,
          name: containerName,
          port: config.port,
          network: `nebula-net-${cleanAppId}`,
          labels: {
            "nebula.managed": "true",
            "nebula.appId": appId,
            "nebula.dbId": instance.id,
            "nebula.engine": normalizedEngine,
          },
          env: config.getEnv(user, finalPassword, dbName),
        });
      } catch (dockerErr) {
        console.warn("[actions.createDatabase] Container creation warning:", dockerErr);
      }
    }

    const encryptedPass = JSON.stringify(encryptSecret(finalPassword));

    await prisma.databaseInstance.update({
      where: { id: instance.id },
      data: {
        status: "RUNNING",
        containerId: containerId || `mock-${instance.id.slice(-6)}`,
        host,
        port,
        username: user,
        databaseName: dbName,
        encryptedPassword: encryptedPass,
      },
    });

    // Auto-inject DATABASE_URL into environment variables
    const encryptedConn = encryptSecret(connectionUrl);
    await prisma.environmentVariable.upsert({
      where: {
        applicationId_name: {
          applicationId: appId,
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
        applicationId: appId,
        name: "DATABASE_URL",
        encryptedValue: encryptedConn.ciphertext,
        iv: encryptedConn.iv,
        authTag: encryptedConn.authTag,
        source: "PLATFORM_MANAGED",
      },
    });

    revalidatePath(`/apps/${appId}/databases`);
    revalidatePath(`/apps/${appId}`);

    return { success: true, databaseId: instance.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create database";
    console.error("[actions.createDatabase] Error:", message);
    return { success: false, error: message };
  }
}

/**
 * Pause / Sleep database container
 */
export async function sleepDatabase(appId: string, databaseId: string) {
  try {
    await verifyUserAndApp(appId);

    const db = await prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!db || db.applicationId !== appId) {
      throw new Error("Database not found");
    }

    if (db.containerId && !db.containerId.startsWith("mock-")) {
      try {
        await stopAndRemoveContainer(db.containerId);
      } catch (err) {
        console.warn("[actions.sleepDatabase] Error stopping container:", err);
      }
    }

    await prisma.databaseInstance.update({
      where: { id: databaseId },
      data: {
        status: "SLEEPING",
        sleepingSince: new Date(),
      },
    });

    revalidatePath(`/apps/${appId}/databases`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sleep database";
    return { success: false, error: message };
  }
}

/**
 * Wake database container
 */
export async function wakeDatabase(appId: string, databaseId: string) {
  try {
    await verifyUserAndApp(appId);

    await prisma.databaseInstance.update({
      where: { id: databaseId },
      data: {
        status: "RUNNING",
        sleepingSince: null,
      },
    });

    revalidatePath(`/apps/${appId}/databases`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to wake database";
    return { success: false, error: message };
  }
}

/**
 * Delete database container and mark record as DELETED
 */
export async function deleteDatabase(appId: string, databaseId: string) {
  try {
    await verifyUserAndApp(appId);

    const db = await prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!db || db.applicationId !== appId) {
      throw new Error("Database not found");
    }

    if (db.containerId && !db.containerId.startsWith("mock-")) {
      try {
        await stopAndRemoveContainer(db.containerId);
      } catch (err) {
        console.warn("[actions.deleteDatabase] Error removing container:", err);
      }
    }

    await prisma.databaseInstance.update({
      where: { id: databaseId },
      data: {
        status: "DELETED",
      },
    });

    revalidatePath(`/apps/${appId}/databases`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete database";
    return { success: false, error: message };
  }
}

/**
 * Destroy preview environment
 */
export async function destroyPreview(appId: string, previewId: string) {
  try {
    await verifyUserAndApp(appId);

    await prisma.previewEnvironment.update({
      where: { id: previewId },
      data: {
        status: "DESTROYED",
        destroyedAt: new Date(),
      },
    });

    revalidatePath(`/apps/${appId}/previews`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to destroy preview";
    return { success: false, error: message };
  }
}

/**
 * Save encrypted environment variables
 */
export async function setSecrets(appId: string, vars: Record<string, string>) {
  try {
    await verifyUserAndApp(appId);

    for (const [name, value] of Object.entries(vars)) {
      if (name && value && value.trim().length > 0) {
        const encrypted = encryptSecret(value);
        await prisma.environmentVariable.upsert({
          where: {
            applicationId_name: {
              applicationId: appId,
              name: name.trim(),
            },
          },
          update: {
            encryptedValue: encrypted.ciphertext,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            source: "USER",
          },
          create: {
            applicationId: appId,
            name: name.trim(),
            encryptedValue: encrypted.ciphertext,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            source: "USER",
          },
        });
      }
    }

    revalidatePath(`/apps/${appId}/settings`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save environment variables";
    return { success: false, error: message };
  }
}

/**
 * Toggle auto-scaling for an application
 */
export async function toggleScaling(appId: string, enabled: boolean) {
  try {
    await verifyUserAndApp(appId);

    await prisma.application.update({
      where: { id: appId },
      data: {
        scalingEnabled: enabled,
      },
    });

    revalidatePath(`/apps/${appId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle scaling";
    return { success: false, error: message };
  }
}

/**
 * Create a new application
 */
export async function createApplication(data: {
  name: string;
  subdomain: string;
  runtime: string;
  repository?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const accountId = (session?.user as { id?: string } | undefined)?.id;
    if (!accountId) throw new ActionError("Please sign in to create an application.");
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new ActionError("Your account could not be found. Please sign in again.");

    const name = data.name.trim();
    const subdomain = data.subdomain.trim().toLowerCase();
    const repository = data.repository?.trim();
    if (!name || name.length > 64) {
      throw new ActionError("Application name must be between 1 and 64 characters.");
    }
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain)) {
      throw new ActionError("Subdomain must contain lowercase letters, numbers, or hyphens.");
    }
    if (repository && !githubRepositoryUrl(repository)) {
      throw new ActionError("Enter a public GitHub repository as owner/repo or a GitHub HTTPS URL.");
    }

    const app = await prisma.application.create({
      data: {
        accountId: account.id,
        name,
        subdomain,
        runtime: data.runtime,
        repository: repository ? githubRepositoryUrl(repository) : null,
        sourceType: repository ? "git" : "archive",
        status: "sleeping",
      },
    });

    revalidatePath("/apps");
    return { success: true, appId: app.id };
  } catch (error) {
    return { success: false, error: actionFailure("createApplication", error, "Could not create application.") };
  }
}

/**
 * Approve RFC 8628 Device Code authorization for an AI coding agent or CLI.
 */
export async function approveDeviceCode(rawUserCode: string) {
  try {
    const formattedCode = rawUserCode.trim().toUpperCase();
    const record = await prisma.deviceCode.findFirst({
      where: {
        userCode: formattedCode,
        status: "authorization_pending",
      },
    });

    if (!record) {
      return { success: false, error: "Invalid, expired, or already approved code." };
    }

    if (new Date() > record.expiresAt) {
      return { success: false, error: "This authorization code has expired. Please request a new one." };
    }

    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
    const sessionEmail = session?.user?.email;

    if (!session || (!sessionUserId && !sessionEmail)) {
      return {
        success: false,
        error: "Authentication required. Please sign in to your Nebula account to authorize this device.",
      };
    }

    const account = sessionUserId
      ? await prisma.account.findUnique({ where: { id: sessionUserId } })
      : await prisma.account.findUnique({ where: { email: sessionEmail! } });

    if (!account) {
      return { success: false, error: "User account not found. Please sign in again." };
    }

    await prisma.deviceCode.update({
      where: { id: record.id },
      data: {
        status: "approved",
        accountId: account.id,
        approvedAt: new Date(),
      },
    });

    return { success: true, clientId: record.clientId || "AI Coding Agent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve device code";
    return { success: false, error: message };
  }
}

/**
 * Deny RFC 8628 Device Code authorization.
 */
export async function denyDeviceCode(rawUserCode: string) {
  try {
    const formattedCode = rawUserCode.trim().toUpperCase();
    const record = await prisma.deviceCode.findFirst({
      where: {
        userCode: formattedCode,
        status: "authorization_pending",
      },
    });

    if (!record) {
      return { success: false, error: "Invalid code or already processed." };
    }

    await prisma.deviceCode.update({
      where: { id: record.id },
      data: {
        status: "denied",
      },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to deny device code";
    return { success: false, error: message };
  }
}

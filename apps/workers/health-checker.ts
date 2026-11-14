import "dotenv/config";

/**
 * ShipLane Health Checker Worker
 * Runs every 60 seconds to ping running applications and wake sleeping ones.
 * Records results in the HealthCheck table and handles wake-from-sleep logic.
 */

import { Worker, Queue, Job } from "bullmq";
import Redis from "ioredis";
import https from "https";
import http from "http";
import { prisma } from "../dashboard/lib/prisma";
import { runContainer, listContainersByLabel } from "../dashboard/lib/docker";
import { writeRouteConfig } from "../dashboard/lib/traefik";

// ---------------------------------------------------------------------------
// Redis connection
// ---------------------------------------------------------------------------
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on("error", (err) => {
  console.error("[HealthChecker Redis Error]", err.message);
});

// A separate non-BullMQ redis client for wakeup flags
const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
});

redisClient.on("error", (err) => {
  console.error("[HealthChecker Redis Client Error]", err.message);
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const HEALTH_INTERVAL_MS = 60 * 1000;    // 60 seconds
const CONSECUTIVE_FAILURES_THRESHOLD = 3; // Mark unhealthy after this many failures
const DOMAIN = process.env.NEBULA_DOMAIN || "nebula.local";

// ---------------------------------------------------------------------------
// HTTP probe helper — returns { ok, statusCode, responseTimeMs }
// ---------------------------------------------------------------------------
async function probeUrl(url: string): Promise<{
  ok: boolean;
  statusCode: number;
  responseTimeMs: number;
}> {
  const lib = url.startsWith("https") ? https : http;
  const start = Date.now();

  return new Promise((resolve) => {
    const req = lib
      .get(url, { timeout: 10_000 }, (res) => {
        const statusCode = res.statusCode ?? 0;
        const responseTimeMs = Date.now() - start;
        const ok = statusCode > 0 && statusCode < 500;
        res.resume(); // drain response body
        resolve({ ok, statusCode, responseTimeMs });
      })
      .on("error", () =>
        resolve({ ok: false, statusCode: 0, responseTimeMs: Date.now() - start })
      )
      .on("timeout", () => {
        req.destroy();
        resolve({ ok: false, statusCode: 0, responseTimeMs: Date.now() - start });
      });
  });
}

// ---------------------------------------------------------------------------
// Determine how many consecutive failures an app has had recently
// ---------------------------------------------------------------------------
async function countRecentFailures(appId: string): Promise<number> {
  const recentChecks = await prisma.healthCheck.findMany({
    where: { applicationId: appId },
    orderBy: { checkedAt: "desc" },
    take: CONSECUTIVE_FAILURES_THRESHOLD,
    select: { status: true },
  });

  let consecutive = 0;
  for (const check of recentChecks) {
    if (check.status === "fail") {
      consecutive++;
    } else {
      break;
    }
  }
  return consecutive;
}

// ---------------------------------------------------------------------------
// Health check a single RUNNING application
// ---------------------------------------------------------------------------
async function checkRunningApp(app: {
  id: string;
  subdomain: string;
  status: string;
}): Promise<void> {
  const url = `https://${app.subdomain}.${DOMAIN}/`;
  console.log(`[HealthChecker] Probing ${url}`);

  const { ok, statusCode, responseTimeMs } = await probeUrl(url);
  const status = ok ? "pass" : "fail";

  await prisma.healthCheck.create({
    data: {
      applicationId: app.id,
      status,
      statusCode,
      responseTimeMs,
    },
  });

  if (!ok) {
    const failures = await countRecentFailures(app.id);
    console.warn(
      `[HealthChecker] App ${app.id} (${app.subdomain}) FAILED health check ` +
        `(status=${statusCode}). Consecutive failures: ${failures}`
    );
    if (failures >= CONSECUTIVE_FAILURES_THRESHOLD) {
      console.error(
        `[HealthChecker] App ${app.id} reached ${failures} consecutive failures — marking unhealthy`
      );
      await prisma.application.update({
        where: { id: app.id },
        data: { status: "unhealthy" },
      });
      // TODO: trigger alert (email / webhook) in a future phase
    }
  } else {
    console.log(
      `[HealthChecker] App ${app.id} (${app.subdomain}) OK (${statusCode}, ${responseTimeMs}ms)`
    );
    // If it was previously unhealthy and is now responding, restore running status
    if ((app as any).status === "unhealthy") {
      await prisma.application.update({
        where: { id: app.id },
        data: { status: "running" },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Wake a sleeping application if a wakeup flag is set in Redis
// ---------------------------------------------------------------------------
async function handleSleepingApp(app: {
  id: string;
  subdomain: string;
  port: number;
  runtime: string | null;
}): Promise<void> {
  const wakeupKey = `nebula:wakeup:${app.id}`;
  const shouldWake = await redisClient.get(wakeupKey);

  if (!shouldWake) {
    return; // Not flagged for wakeup
  }

  console.log(`[HealthChecker] Waking up sleeping app ${app.id} (${app.subdomain})`);

  // Find the latest image tag for this app by inspecting stopped containers
  let stoppedContainers = await listContainersByLabel(`nebula.app.id=${app.id}`);
  if (stoppedContainers.length === 0) {
    stoppedContainers = await listContainersByLabel(`ShipLane.app.id=${app.id}`);
  }
  const cleanAppId = app.id.toLowerCase();
  const latestImage = stoppedContainers[0]?.Image || `nebula-app-${cleanAppId}:latest`;

  try {
    const newContainerId = await runContainer({
      image: latestImage,
      name: `nebula-app-${cleanAppId}`,
      port: app.port,
      memoryLimitMB: 512,
      cpuLimit: 1,
      labels: {
        "traefik.enable": "true",
        "nebula.managed": "true",
        "nebula.app.id": app.id,
      },
      appId: app.id,
    });

    console.log(
      `[HealthChecker] App ${app.id} woke up — container: ${newContainerId.substring(0, 12)}`
    );

    // Update Traefik route with new container IP
    const { docker } = await import("../dashboard/lib/docker");
    const info = await docker.getContainer(newContainerId).inspect();
    const networks = info.NetworkSettings?.Networks || {};
    const ip =
      (networks[`nebula-net-${cleanAppId}`] as any)?.IPAddress ||
      (networks[`ShipLane-net-${app.id}`] as any)?.IPAddress ||
      (Object.values(networks)[0] as any)?.IPAddress;

    if (ip && app.subdomain) {
      await writeRouteConfig(app.id, app.subdomain, ip, app.port);
    }

    await prisma.application.update({
      where: { id: app.id },
      data: { status: "running", currentInstances: 1 },
    });

    // Clear the wakeup flag
    await redisClient.del(wakeupKey);

    await prisma.healthCheck.create({
      data: {
        applicationId: app.id,
        status: "wake",
        statusCode: 0,
        responseTimeMs: 0,
      },
    });
  } catch (err) {
    console.error(`[HealthChecker] Failed to wake up app ${app.id}:`, err);
  }
}

// ---------------------------------------------------------------------------
// Main health-check loop
// ---------------------------------------------------------------------------
async function runHealthLoop(_job?: Job): Promise<void> {
  console.log("[HealthChecker] Running health check loop...");

  let apps: {
    id: string;
    subdomain: string;
    status: string;
    port: number;
    runtime: string | null;
  }[];

  try {
    apps = await prisma.application.findMany({
      where: {
        status: { in: ["running", "unhealthy", "sleeping"] },
      },
      select: {
        id: true,
        subdomain: true,
        status: true,
        port: true,
        runtime: true,
      },
    });
  } catch (err) {
    console.error("[HealthChecker] Failed to fetch applications:", err);
    return;
  }

  console.log(`[HealthChecker] Checking ${apps.length} applications`);

  for (const app of apps) {
    try {
      if (app.status === "running" || app.status === "unhealthy") {
        await checkRunningApp(app);
      } else if (app.status === "sleeping") {
        await handleSleepingApp(app);
      }
    } catch (err) {
      console.error(`[HealthChecker] Error checking app ${app.id}:`, err);
    }
  }

  console.log("[HealthChecker] Health check loop complete");
}

// ---------------------------------------------------------------------------
// BullMQ Worker + Repeatable job
// ---------------------------------------------------------------------------
const healthQueue = new Queue("nebula-health", { connection: redisConnection });

const worker = new Worker("nebula-health", runHealthLoop, {
  connection: redisConnection,
  concurrency: 1,
});

worker.on("completed", () => {
  console.log("[HealthChecker] Tick completed");
});

worker.on("failed", (job, err) => {
  console.error(`[HealthChecker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[HealthChecker] Worker error:", err.message);
});

healthQueue
  .add(
    "health-tick",
    {},
    {
      repeat: { every: HEALTH_INTERVAL_MS },
      jobId: "health-tick-singleton",
    }
  )
  .then(() => {
    console.log(
      `[HealthChecker] Repeatable job registered (every ${HEALTH_INTERVAL_MS / 1000}s)`
    );
  })
  .catch((err) => {
    console.error("[HealthChecker] Failed to register repeatable job:", err);
    setInterval(() => runHealthLoop(), HEALTH_INTERVAL_MS);
    console.log("[HealthChecker] Fallback: using setInterval");
  });

console.log("[HealthChecker] Worker started...");

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
async function shutdown() {
  console.log("[HealthChecker] Received shutdown signal...");
  await worker.close();
  await healthQueue.close();
  await redisConnection.quit();
  await redisClient.quit();
  console.log("[HealthChecker] Worker shut down cleanly.");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

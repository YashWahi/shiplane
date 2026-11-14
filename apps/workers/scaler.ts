import "dotenv/config";

/**
 * ShipLane Auto-Scaler Worker
 * Runs every 30 seconds to monitor container resource utilization
 * and horizontally scale applications up, down, or to zero (sleep).
 */

import { Worker, Queue, Job } from "bullmq";
import Redis from "ioredis";
import { prisma } from "../dashboard/lib/prisma";
import {
  runContainer,
  stopAndRemoveContainer,
  listContainersByLabel,
  getContainerStats,
} from "../dashboard/lib/docker";

// ---------------------------------------------------------------------------
// Redis connection
// ---------------------------------------------------------------------------
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on("error", (err) => {
  console.error("[Scaler Redis Error]", err.message);
});

// A separate Redis client used for reading traffic counters (non-BullMQ use).
const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
});

redisClient.on("error", (err) => {
  console.error("[Scaler Redis Client Error]", err.message);
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CPU_SCALE_UP_THRESHOLD = 70;     // % — scale up if average CPU exceeds this
const CPU_SCALE_DOWN_THRESHOLD = 10;   // % — scale down if average CPU is below this
const SLEEP_IDLE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes of zero traffic → sleep
const SCALER_INTERVAL_MS = 30 * 1000;  // 30 seconds

// ---------------------------------------------------------------------------
// Scaler logic for a single application
// ---------------------------------------------------------------------------
async function scaleApp(app: {
  id: string;
  accountId: string;
  name: string;
  status: string;
  scalingEnabled: boolean;
  minInstances: number;
  maxInstances: number;
  currentInstances: number;
  runtime: string | null;
  port: number;
}): Promise<void> {
  const { id: appId, name, minInstances, maxInstances, currentInstances } = app;

  // Fetch all running containers for this app
  let containers = await listContainersByLabel(`nebula.app.id=${appId}`);
  if (containers.length === 0) {
    containers = await listContainersByLabel(`ShipLane.app.id=${appId}`);
  }
  const runningContainers = containers.filter((c) => c.State === "running");

  if (runningContainers.length === 0 && currentInstances > 0) {
    // Containers disappeared unexpectedly — reconcile DB
    console.log(`[Scaler] App ${name} (${appId}): containers missing, resetting to 0`);
    await prisma.application.update({
      where: { id: appId },
      data: { currentInstances: 0, status: "sleeping" },
    });
    return;
  }

  // -------------------------------------------------------------------------
  // Scale-to-Zero (Sleep) check
  // -------------------------------------------------------------------------
  if (runningContainers.length > 0) {
    const trafficKey = `nebula:traffic:${appId}`;
    const lastTrafficTs = await redisClient.get(trafficKey);
    const now = Date.now();
    // Do not kill immediately if no traffic key exists yet; allow grace period
    const msSinceTraffic = lastTrafficTs
      ? now - parseInt(lastTrafficTs, 10)
      : 0;

    if (msSinceTraffic > SLEEP_IDLE_WINDOW_MS) {
      console.log(
        `[Scaler] App ${name} (${appId}): idle for ${Math.round(msSinceTraffic / 60000)} minutes — scaling to zero`
      );
      for (const c of runningContainers) {
        await stopAndRemoveContainer(c.Id).catch((err) =>
          console.error(`[Scaler] Error stopping container ${c.Id}:`, err)
        );
      }
      await prisma.application.update({
        where: { id: appId },
        data: { status: "sleeping", currentInstances: 0 },
      });
      await prisma.usageEvent.create({
        data: {
          accountId: app.accountId,
          applicationId: appId,
          kind: "scale_to_zero",
          units: 0,
        },
      });
      console.log(`[Scaler] App ${name} (${appId}): scaled to zero (sleeping)`);
      return;
    }
  }

  // -------------------------------------------------------------------------
  // Gather CPU & memory stats across all running containers
  // -------------------------------------------------------------------------
  let totalCpu = 0;
  let sampledCount = 0;

  for (const c of runningContainers) {
    try {
      const stats = await getContainerStats(c.Id);
      totalCpu += stats.cpuPercent;
      sampledCount++;
    } catch (err) {
      console.warn(`[Scaler] Failed to get stats for container ${c.Id}:`, err);
    }
  }

  if (sampledCount === 0) {
    console.log(`[Scaler] App ${name} (${appId}): no stats available, skipping`);
    return;
  }

  const avgCpu = totalCpu / sampledCount;
  console.log(
    `[Scaler] App ${name} (${appId}): avgCPU=${avgCpu.toFixed(1)}%, instances=${currentInstances}/${maxInstances}`
  );

  // -------------------------------------------------------------------------
  // Scale UP
  // -------------------------------------------------------------------------
  if (avgCpu > CPU_SCALE_UP_THRESHOLD && currentInstances < maxInstances) {
    console.log(
      `[Scaler] App ${name} (${appId}): scaling UP (cpu=${avgCpu.toFixed(1)}%)`
    );

    // Find the image tag from an existing container
    const existingContainer = runningContainers[0];
    const imageTag = existingContainer?.Image || `nebula-app-${appId.toLowerCase()}:latest`;

    try {
      const newContainerId = await runContainer({
        image: imageTag,
        name: `nebula-app-${appId.toLowerCase()}-replica-${Date.now()}`,
        port: app.port,
        memoryLimitMB: 512,
        cpuLimit: 1,
        labels: {
          "traefik.enable": "true",
          "nebula.managed": "true",
          "nebula.app.id": appId,
        },
        appId,
      });

      console.log(
        `[Scaler] App ${name} (${appId}): new replica started: ${newContainerId.substring(0, 12)}`
      );

      await prisma.application.update({
        where: { id: appId },
        data: { currentInstances: currentInstances + 1 },
      });

      await prisma.usageEvent.create({
        data: {
          accountId: app.accountId,
          applicationId: appId,
          kind: "scale_up",
          units: 1,
        },
      });
    } catch (err) {
      console.error(`[Scaler] Failed to scale up app ${appId}:`, err);
    }
    return;
  }

  // -------------------------------------------------------------------------
  // Scale DOWN
  // -------------------------------------------------------------------------
  if (avgCpu < CPU_SCALE_DOWN_THRESHOLD && currentInstances > minInstances) {
    console.log(
      `[Scaler] App ${name} (${appId}): scaling DOWN (cpu=${avgCpu.toFixed(1)}%)`
    );

    // Pick the most recently started container to remove
    const containerToRemove = runningContainers[runningContainers.length - 1];

    try {
      await stopAndRemoveContainer(containerToRemove.Id);
      console.log(
        `[Scaler] App ${name} (${appId}): removed replica ${containerToRemove.Id.substring(0, 12)}`
      );

      const newCount = Math.max(currentInstances - 1, minInstances);
      await prisma.application.update({
        where: { id: appId },
        data: {
          currentInstances: newCount,
          status: newCount === 0 ? "sleeping" : "running",
        },
      });

      await prisma.usageEvent.create({
        data: {
          accountId: app.accountId,
          applicationId: appId,
          kind: "scale_down",
          units: 1,
        },
      });
    } catch (err) {
      console.error(`[Scaler] Failed to scale down app ${appId}:`, err);
    }
    return;
  }

  // No scaling action required
  console.log(`[Scaler] App ${name} (${appId}): no scaling action needed`);
}

// ---------------------------------------------------------------------------
// Scaler loop — invoked every 30 seconds by a repeatable BullMQ job
// ---------------------------------------------------------------------------
async function runScalerLoop(_job?: Job): Promise<void> {
  console.log("[Scaler] Running scaler loop...");

  let apps: {
    id: string;
    accountId: string;
    name: string;
    status: string;
    scalingEnabled: boolean;
    minInstances: number;
    maxInstances: number;
    currentInstances: number;
    runtime: string | null;
    port: number;
  }[];

  try {
    apps = await prisma.application.findMany({
      where: {
        scalingEnabled: true,
        status: { in: ["running", "sleeping"] },
      },
      select: {
        id: true,
        accountId: true,
        name: true,
        status: true,
        scalingEnabled: true,
        minInstances: true,
        maxInstances: true,
        currentInstances: true,
        runtime: true,
        port: true,
      },
    });
  } catch (err) {
    console.error("[Scaler] Failed to fetch applications:", err);
    return;
  }

  console.log(`[Scaler] Checking ${apps.length} scaling-enabled applications`);

  for (const app of apps) {
    try {
      await scaleApp(app);
    } catch (err) {
      console.error(`[Scaler] Error scaling app ${app.id}:`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// BullMQ Worker + Repeatable job for 30-second cadence
// ---------------------------------------------------------------------------
const scalerQueue = new Queue("nebula-scaler", { connection: redisConnection });

const worker = new Worker("nebula-scaler", runScalerLoop, {
  connection: redisConnection,
  concurrency: 1, // Scaler is a singleton — never run in parallel
});

worker.on("completed", () => {
  console.log("[Scaler] Scaler tick completed");
});

worker.on("failed", (job, err) => {
  console.error(`[Scaler] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[Scaler] Worker error:", err.message);
});

// Register the repeatable job (idempotent — BullMQ deduplicates by key)
scalerQueue
  .add(
    "scaler-tick",
    {},
    {
      repeat: { every: SCALER_INTERVAL_MS },
      jobId: "scaler-tick-singleton",
    }
  )
  .then(() => {
    console.log(
      `[Scaler] Repeatable job registered (every ${SCALER_INTERVAL_MS / 1000}s)`
    );
  })
  .catch((err) => {
    console.error("[Scaler] Failed to register repeatable job:", err);
    // Fallback: use setInterval if the queue registration fails
    setInterval(() => runScalerLoop(), SCALER_INTERVAL_MS);
    console.log("[Scaler] Fallback: using setInterval");
  });

console.log("[Scaler] Auto-scaler worker started...");

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
async function shutdown() {
  console.log("[Scaler] Received shutdown signal...");
  await worker.close();
  await scalerQueue.close();
  await redisConnection.quit();
  await redisClient.quit();
  console.log("[Scaler] Worker shut down cleanly.");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

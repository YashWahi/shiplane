import "dotenv/config";

/**
 * ShipLane Cleanup Worker — Garbage Collection & Preview Teardown
 * Runs every hour to:
 *   1. Destroy expired preview environments
 *   2. Prune dangling Docker images
 *   3. Remove orphaned exited containers older than 24 hours
 */

import { Worker, Queue, Job } from "bullmq";
import Redis from "ioredis";
import { prisma } from "../dashboard/lib/prisma";
import {
  docker,
  stopAndRemoveContainer,
  listContainersByLabel,
} from "../dashboard/lib/docker";
import { deletePreviewRouteConfig } from "../dashboard/lib/traefik";

// ---------------------------------------------------------------------------
// Redis connection
// ---------------------------------------------------------------------------
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on("error", (err) => {
  console.error("[Cleanup Redis Error]", err.message);
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const ORPHAN_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// 1. Preview Environment Teardown
// ---------------------------------------------------------------------------
async function teardownExpiredPreviews(): Promise<void> {
  console.log("[Cleanup] Scanning for expired preview environments...");

  const expiredPreviews = await prisma.previewEnvironment.findMany({
    where: {
      expiresAt: { lt: new Date() },
      status: { not: "DESTROYED" },
    },
    include: {
      application: {
        select: { id: true, subdomain: true },
      },
    },
  });

  console.log(`[Cleanup] Found ${expiredPreviews.length} expired preview(s)`);

  for (const preview of expiredPreviews) {
    console.log(
      `[Cleanup] Destroying preview ${preview.id} (branch: ${preview.branch}, expired: ${preview.expiresAt.toISOString()})`
    );

    try {
      // Stop and remove all containers associated with this preview
      let previewContainers = await listContainersByLabel(
        `nebula.preview.id=${preview.id}`
      );
      if (previewContainers.length === 0) {
        previewContainers = await listContainersByLabel(
          `ShipLane.preview.id=${preview.id}`
        );
      }
      for (const c of previewContainers) {
        console.log(
          `[Cleanup] Removing preview container ${c.Id.substring(0, 12)}`
        );
        await stopAndRemoveContainer(c.Id).catch((err) =>
          console.warn(`[Cleanup] Error removing preview container ${c.Id}:`, err)
        );
      }

      // Remove Traefik route for this preview
      await deletePreviewRouteConfig(preview.id).catch((err) =>
        console.warn(`[Cleanup] Error deleting preview route for ${preview.id}:`, err)
      );

      // If the preview had a dedicated database clone, stop that container too
      if (preview.databaseCloneId) {
        console.log(
          `[Cleanup] Stopping database clone container for preview ${preview.id}`
        );
        const dbContainers = await listContainersByLabel(
          `ShipLane.db.clone.id=${preview.databaseCloneId}`
        ).catch(() => []);

        for (const c of dbContainers) {
          await stopAndRemoveContainer(c.Id).catch((err) =>
            console.warn(`[Cleanup] Error stopping DB clone container ${c.Id}:`, err)
          );
        }

        // Mark the DatabaseInstance as deleted
        await prisma.databaseInstance
          .update({
            where: { id: preview.databaseCloneId },
            data: { status: "DELETED" },
          })
          .catch((err) =>
            console.warn(
              `[Cleanup] Could not update DB clone status for ${preview.databaseCloneId}:`,
              err
            )
          );
      }

      // Mark the preview as DESTROYED in the DB
      await prisma.previewEnvironment.update({
        where: { id: preview.id },
        data: {
          status: "DESTROYED",
          destroyedAt: new Date(),
        },
      });

      console.log(`[Cleanup] Preview ${preview.id} destroyed successfully`);
    } catch (err) {
      console.error(`[Cleanup] Error destroying preview ${preview.id}:`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Docker Image Pruning — remove dangling images (untagged)
// ---------------------------------------------------------------------------
async function pruneDanglingImages(): Promise<void> {
  console.log("[Cleanup] Pruning dangling Docker images...");

  try {
    // List images with dangling=true filter
    const danglingImages = await docker.listImages({
      filters: { dangling: ["true"] },
    });

    console.log(
      `[Cleanup] Found ${danglingImages.length} dangling image(s) to remove`
    );

    let removed = 0;
    for (const image of danglingImages) {
      try {
        const img = docker.getImage(image.Id);
        await img.remove({ force: false });
        removed++;
        console.log(
          `[Cleanup] Removed dangling image: ${image.Id.substring(0, 20)}`
        );
      } catch (err: any) {
        // 409: image in use — skip silently
        if (err.statusCode !== 409) {
          console.warn(
            `[Cleanup] Failed to remove image ${image.Id.substring(0, 20)}:`,
            err.message
          );
        }
      }
    }

    console.log(`[Cleanup] Removed ${removed}/${danglingImages.length} dangling images`);
  } catch (err) {
    console.error("[Cleanup] Failed to list/prune dangling images:", err);
  }
}

// ---------------------------------------------------------------------------
// 3. Orphan Container Cleanup — exited ShipLane containers older than 24 hours
// ---------------------------------------------------------------------------
async function removeOrphanContainers(): Promise<void> {
  console.log("[Cleanup] Scanning for orphaned exited containers...");

  try {
    // Get all containers that are exited AND have a nebula.app.id label
    const exitedContainers = await docker.listContainers({
      all: true,
      filters: {
        status: ["exited"],
        label: ["nebula.app.id"],
      },
    });

    const cutoff = Date.now() - ORPHAN_THRESHOLD_MS;
    let removed = 0;

    for (const c of exitedContainers) {
      // c.Created is a Unix timestamp in seconds
      const createdMs = c.Created * 1000;
      const ageMs = Date.now() - createdMs;

      if (ageMs < ORPHAN_THRESHOLD_MS) {
        continue; // Too recent — leave it
      }

      const ageHours = Math.round(ageMs / (1000 * 60 * 60));
      console.log(
        `[Cleanup] Removing orphan container ${c.Id.substring(0, 12)} ` +
          `(image: ${c.Image}, age: ${ageHours}h, names: ${c.Names.join(", ")})`
      );

      try {
        await stopAndRemoveContainer(c.Id);
        removed++;
      } catch (err) {
        console.warn(
          `[Cleanup] Failed to remove orphan container ${c.Id.substring(0, 12)}:`,
          err
        );
      }
    }

    console.log(
      `[Cleanup] Removed ${removed} orphaned container(s) (older than 24h)`
    );
  } catch (err) {
    console.error("[Cleanup] Failed to list/remove orphaned containers:", err);
  }
}

// ---------------------------------------------------------------------------
// Main cleanup loop
// ---------------------------------------------------------------------------
async function runCleanupLoop(_job?: Job): Promise<void> {
  console.log("[Cleanup] Starting cleanup run...");
  const start = Date.now();

  try {
    await teardownExpiredPreviews();
  } catch (err) {
    console.error("[Cleanup] Preview teardown threw unexpected error:", err);
  }

  try {
    await pruneDanglingImages();
  } catch (err) {
    console.error("[Cleanup] Image pruning threw unexpected error:", err);
  }

  try {
    await removeOrphanContainers();
  } catch (err) {
    console.error("[Cleanup] Orphan cleanup threw unexpected error:", err);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[Cleanup] Cleanup run complete in ${elapsed}s`);
}

// ---------------------------------------------------------------------------
// BullMQ Worker + Repeatable job
// ---------------------------------------------------------------------------
const cleanupQueue = new Queue("nebula-cleanup", { connection: redisConnection });

const worker = new Worker("nebula-cleanup", runCleanupLoop, {
  connection: redisConnection,
  concurrency: 1,
});

worker.on("completed", () => {
  console.log("[Cleanup] Tick completed");
});

worker.on("failed", (job, err) => {
  console.error(`[Cleanup] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[Cleanup] Worker error:", err.message);
});

cleanupQueue
  .add(
    "cleanup-tick",
    {},
    {
      repeat: { every: CLEANUP_INTERVAL_MS },
      jobId: "cleanup-tick-singleton",
    }
  )
  .then(() => {
    console.log(
      `[Cleanup] Repeatable job registered (every ${CLEANUP_INTERVAL_MS / 60000} minutes)`
    );
  })
  .catch((err) => {
    console.error("[Cleanup] Failed to register repeatable job:", err);
    setInterval(() => runCleanupLoop(), CLEANUP_INTERVAL_MS);
    console.log("[Cleanup] Fallback: using setInterval");
  });

// Run an initial cleanup shortly after startup (5 minutes) so we don't have to wait a full hour
setTimeout(() => {
  console.log("[Cleanup] Running startup cleanup pass...");
  runCleanupLoop().catch((err) =>
    console.error("[Cleanup] Startup cleanup failed:", err)
  );
}, 5 * 60 * 1000);

console.log("[Cleanup] Garbage collection worker started...");

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
async function shutdown() {
  console.log("[Cleanup] Received shutdown signal...");
  await worker.close();
  await cleanupQueue.close();
  await redisConnection.quit();
  console.log("[Cleanup] Worker shut down cleanly.");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

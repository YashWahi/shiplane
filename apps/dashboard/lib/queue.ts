import { Queue } from "bullmq";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Shared Redis client instance for BullMQ queues with required maxRetriesPerRequest: null
 */
export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on("error", (err) => {
  console.error("[Queue Redis Error]", err.message);
});

export interface DeploymentJobPayload {
  appId: string;
  deploymentId?: string;
  previewId?: string;
  sourcePath: string;
  isPreview?: boolean;
}

export interface ScalerJobPayload {
  appId: string;
  targetReplicas?: number;
  reason?: string;
}

export interface HealthJobPayload {
  appId: string;
  containerId?: string;
  url?: string;
}

export interface CleanupJobPayload {
  appId?: string;
  containerId?: string;
  imageTag?: string;
}

/**
 * BullMQ Queues
 */
export const deploymentQueue = new Queue<DeploymentJobPayload>("nebula-deployments", {
  connection: redisConnection,
});

export const scalerQueue = new Queue<ScalerJobPayload>("nebula-scaler", {
  connection: redisConnection,
});

export const healthQueue = new Queue<HealthJobPayload>("nebula-health", {
  connection: redisConnection,
});

export const cleanupQueue = new Queue<CleanupJobPayload>("nebula-cleanup", {
  connection: redisConnection,
});

/**
 * Adds a new production deployment job to the deployment queue.
 *
 * @param appId The application identifier.
 * @param deploymentId The deployment record ID.
 * @param sourcePath Local filesystem path to the unpacked source directory.
 * @returns The BullMQ job ID.
 */
export async function queueDeploymentJob(
  appId: string,
  deploymentId: string,
  sourcePath: string
): Promise<string> {
  try {
    const job = await deploymentQueue.add(
      `deploy-${appId}-${deploymentId}`,
      {
        appId,
        deploymentId,
        sourcePath,
        isPreview: false,
      },
      {
        jobId: deploymentId,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
        },
        removeOnFail: {
          count: 500,
        },
      }
    );

    console.log(`[Queue] Queued deployment job ${job.id} for app ${appId}`);
    return job.id || "";
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Queue] Failed to queue deployment for app ${appId}:`, err);
    throw new Error(`Failed to queue deployment job: ${err}`);
  }
}

/**
 * Adds a preview environment deployment job to the deployment queue.
 *
 * @param appId The application identifier.
 * @param previewId The preview environment record ID.
 * @param sourcePath Local filesystem path to the unpacked source directory.
 * @returns The BullMQ job ID.
 */
export async function queuePreviewJob(
  appId: string,
  previewId: string,
  sourcePath: string,
  deploymentId?: string
): Promise<string> {
  try {
    const job = await deploymentQueue.add(
      `preview-${appId}-${previewId}`,
      {
        appId,
        previewId,
        sourcePath,
        isPreview: true,
      },
      {
        ...(deploymentId ? { jobId: deploymentId } : {}),
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: {
          count: 50,
        },
        removeOnFail: {
          count: 200,
        },
      }
    );

    console.log(`[Queue] Queued preview job ${job.id} for app ${appId}`);
    return job.id || "";
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Queue] Failed to queue preview for app ${appId}:`, err);
    throw new Error(`Failed to queue preview job: ${err}`);
  }
}

/**
 * Gracefully shuts down all BullMQ queues and closes the Redis connection.
 */
export async function closeQueues(): Promise<void> {
  try {
    await Promise.all([
      deploymentQueue.close(),
      scalerQueue.close(),
      healthQueue.close(),
      cleanupQueue.close(),
    ]);
    await redisConnection.quit();
    console.log("[Queue] Successfully closed all queues and Redis connection");
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error("[Queue] Error while closing queues:", err);
  }
}

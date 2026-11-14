import "dotenv/config";

/**
 * ShipLane Build Worker — The Deployment State Machine
 * Processes jobs from the `ShipLane-deployments` BullMQ queue.
 * Drives deployments through the full lifecycle:
 * QUEUED → ANALYZING → BUILDING → RELEASING → HEALTH_CHECK → LIVE (or FAILED)
 */

import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import * as tar from "tar";
import http from "http";
import https from "https";
import { prisma } from "../dashboard/lib/prisma";
import { analyzeProject } from "../dashboard/lib/agent-detection";
import {
  buildImage,
  runContainer,
  stopAndRemoveContainer,
  listContainersByLabel,
  docker,
} from "../dashboard/lib/docker";
import { decryptSecret } from "../dashboard/lib/crypto";
import {
  writeRouteConfig,
  writePreviewRouteConfig,
  deleteRouteConfig,
  deletePreviewRouteConfig,
} from "../dashboard/lib/traefik";
import { runSecurityScan } from "../dashboard/lib/security-scanner";
import { getObjectStream } from "../dashboard/lib/storage";
import type { ProjectSpec } from "@ShipLane/shared";

// ---------------------------------------------------------------------------
// Redis connection (must use maxRetriesPerRequest: null for BullMQ)
// ---------------------------------------------------------------------------
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on("error", (err) => {
  console.error("[Builder Redis Error]", err.message);
});

// ---------------------------------------------------------------------------
// Job payload (matches queueDeploymentJob / queuePreviewJob signature)
// ---------------------------------------------------------------------------
interface DeploymentJobPayload {
  appId: string;
  deploymentId?: string;
  previewId?: string;
  sourcePath: string;
  isPreview?: boolean;
}

const MAX_SOURCE_ARCHIVE_BYTES = 100 * 1024 * 1024;
const MAX_EXTRACTED_SOURCE_BYTES = 512 * 1024 * 1024;
const MAX_SOURCE_ARCHIVE_ENTRIES = 20_000;

function isAllowedGitSource(source: string): boolean {
  if (/^git@github\.com:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git$/.test(source)) {
    return true;
  }

  try {
    const url = new URL(source);
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(url.pathname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function isSafeArchiveEntry(entryPath: string): boolean {
  const normalized = entryPath.replace(/\\/g, "/");
  return (
    normalized.length > 0 &&
    !normalized.startsWith("/") &&
    !/^[A-Za-z]:/.test(normalized) &&
    !normalized.split("/").includes("..")
  );
}

function deploymentFailureSummary(error: unknown, failedStep: string): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("archive") || message.includes("GitHub")) return message;
  if (failedStep === "HEALTH_CHECK") {
    return "The application did not respond to the health check. Review the deployment logs.";
  }
  if (failedStep === "BUILDING") {
    return "The application image could not be built. Review the build logs for details.";
  }
  if (failedStep === "RELEASING") {
    return "The application container could not be released. Review the deployment logs.";
  }
  return `Deployment failed during ${failedStep.toLowerCase()}. Review the deployment logs.`;
}

async function materializeArchive(objectKey: string): Promise<string> {
  if (!/^deployments\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.tar\.gz$/.test(objectKey)) {
    throw new Error("Invalid deployment archive reference.");
  }

  const tempRoot = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "nebula-archive-")
  );
  const archivePath = path.join(tempRoot, "source.tar.gz");
  const sourceDir = path.join(tempRoot, "source");

  try {
    const objectStream = await getObjectStream(objectKey);
    let archiveBytes = 0;
    const sizeLimiter = new Transform({
      transform(chunk, _encoding, callback) {
        archiveBytes += chunk.length;
        if (archiveBytes > MAX_SOURCE_ARCHIVE_BYTES) {
          callback(new Error("Deployment archive exceeds the 100 MB limit."));
          return;
        }
        callback(null, chunk);
      },
    });
    await pipeline(
      objectStream,
      sizeLimiter,
      fs.createWriteStream(archivePath, { flags: "wx" })
    );

    let entryCount = 0;
    let extractedBytes = 0;
    let invalidEntry = false;
    await tar.t({
      file: archivePath,
      strict: true,
      onentry(entry) {
        entryCount += 1;
        extractedBytes += Number(entry.size) || 0;
        const entryType = "type" in entry ? entry.type : undefined;
        if (
          !isSafeArchiveEntry(entry.path) ||
          entryType === "SymbolicLink" ||
          entryType === "Link" ||
          entryCount > MAX_SOURCE_ARCHIVE_ENTRIES ||
          extractedBytes > MAX_EXTRACTED_SOURCE_BYTES
        ) {
          invalidEntry = true;
        }
      },
    });

    if (invalidEntry) {
      throw new Error("Deployment archive contains unsafe paths or exceeds extraction limits.");
    }

    await fs.promises.mkdir(sourceDir, { recursive: true });
    await tar.x({
      file: archivePath,
      cwd: sourceDir,
      strict: true,
      preservePaths: false,
      maxMetaEntrySize: 1024 * 1024,
      filter(entryPath, entry) {
        const entryType = "type" in entry ? entry.type : undefined;
        return (
          isSafeArchiveEntry(entryPath) &&
          entryType !== "SymbolicLink" &&
          entryType !== "Link"
        );
      },
    });

    await fs.promises.unlink(archivePath);
    return sourceDir;
  } catch (error) {
    await fs.promises.rm(tempRoot, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Dockerfile template generators
// ---------------------------------------------------------------------------
function generateNodeDockerfile(spec: ProjectSpec): string {
  const lines: string[] = [
    "FROM node:20-slim",
    "WORKDIR /app",
    "COPY package*.json ./",
    "RUN npm install --production=false",
    "COPY . .",
  ];
  if (spec.buildCommand) {
    lines.push(`RUN ${spec.buildCommand}`);
  }
  lines.push(`EXPOSE ${spec.port}`);
  if (spec.startCommand) {
    lines.push(`CMD ["sh", "-c", "${spec.startCommand}"]`);
  } else {
    lines.push('CMD ["npm", "run", "start"]');
  }
  return lines.join("\n") + "\n";
}

function generatePythonDockerfile(spec: ProjectSpec): string {
  const lines: string[] = [
    "FROM python:3.11-slim",
    "WORKDIR /app",
    "COPY requirements.txt ./",
    "RUN pip install --no-cache-dir -r requirements.txt",
    "COPY . .",
    `EXPOSE ${spec.port}`,
    `CMD ["sh", "-c", "${spec.startCommand || "python main.py"}"]`,
  ];
  return lines.join("\n") + "\n";
}

function generateGoDockerfile(spec: ProjectSpec): string {
  return (
    [
      "FROM golang:1.22-alpine AS builder",
      "WORKDIR /app",
      "COPY . .",
      "RUN go build -o main .",
      "",
      "FROM alpine:latest",
      "WORKDIR /app",
      "COPY --from=builder /app/main .",
      `EXPOSE ${spec.port}`,
      'CMD ["./main"]',
    ].join("\n") + "\n"
  );
}

function generateStaticDockerfile(): string {
  return (
    [
      "FROM nginx:alpine",
      "COPY . /usr/share/nginx/html",
      "EXPOSE 80",
    ].join("\n") + "\n"
  );
}

function generateDockerfile(spec: ProjectSpec): string {
  switch (spec.runtime) {
    case "node":
      return generateNodeDockerfile(spec);
    case "python":
      return generatePythonDockerfile(spec);
    case "go":
      return generateGoDockerfile(spec);
    case "static":
    default:
      return generateStaticDockerfile();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Persist a single build log line to the DeploymentLog table. */
async function saveLog(
  deploymentId: string,
  stream: "stdout" | "stderr",
  line: string
): Promise<void> {
  try {
    await prisma.deploymentLog.create({
      data: { deploymentId, stream, line },
    });
  } catch {
    // Non-fatal: log to console if DB write fails
    console.error(`[Builder] DB log write failed: ${line}`);
  }
}

/** Build a logger callback that persists to DB and also echoes to console. */
function makeLogger(deploymentId: string, prefix: string) {
  return (line: string) => {
    const clean = line.replace(/\r?\n$/, "");
    if (!clean) return;
    console.log(`${prefix} ${clean}`);
    saveLog(deploymentId, "stdout", clean);
  };
}

/**
 * Poll an HTTP/HTTPS URL up to `maxAttempts` times with `delayMs` between
 * attempts. Returns true if the server responds with a non-5xx status code.
 */
async function pollUrl(
  url: string,
  maxAttempts = 10,
  delayMs = 3000
): Promise<boolean> {
  const lib = url.startsWith("https") ? https : http;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const ok = await new Promise<boolean>((resolve) => {
        const req = lib
          .get(url, { timeout: 5000 }, (res) => {
            const statusCode = res.statusCode ?? 0;
            resolve(statusCode > 0 && statusCode < 500);
            res.resume();
          })
          .on("error", () => resolve(false))
          .on("timeout", () => {
            req.destroy();
            resolve(false);
          });
      });
      if (ok) {
        console.log(
          `[Builder] Health check passed on attempt ${attempt}: ${url}`
        );
        return true;
      }
    } catch {
      // swallow; retry below
    }
    console.log(
      `[Builder] Health check attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs}ms...`
    );
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

/**
 * Inspect a container to get its first IP address.
 */
async function getContainerIp(
  containerId: string,
  networkName?: string
): Promise<string | null> {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    const networks = info.NetworkSettings?.Networks || {};
    if (networkName && networks[networkName]) {
      return (networks[networkName] as any).IPAddress || null;
    }
    const firstNet = Object.values(networks)[0] as any;
    return firstNet?.IPAddress || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main job processor
// ---------------------------------------------------------------------------
async function processDeployment(
  job: Job<DeploymentJobPayload>
): Promise<void> {
  let {
    appId,
    deploymentId,
    previewId,
    sourcePath: rawSourceDir,
    isPreview = false,
  } = job.data;

  // Ensure deploymentId exists for preview deployments if not explicitly provided
  if (!deploymentId && isPreview && previewId) {
    const existing = await prisma.deployment.findFirst({
      where: { previewId, status: "QUEUED" },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      deploymentId = existing.id;
    } else {
      const created = await prisma.deployment.create({
        data: {
          applicationId: appId,
          previewId,
          isPreview: true,
          sourceHash: `preview-${previewId}`,
          status: "QUEUED",
          currentStep: "QUEUED",
        },
      });
      deploymentId = created.id;
    }
  }

  if (!deploymentId) {
    throw new Error("No deploymentId in job payload");
  }

  let sourceDir = rawSourceDir;
  let temporarySourceRoot: string | undefined;
  let existingContainers: Awaited<ReturnType<typeof listContainersByLabel>> = [];
  let routeSwitched = false;
  let containerIp: string | null = null;
  let subdomain: string | undefined | null;
  let appRecord: Awaited<ReturnType<typeof prisma.application.findUnique>> = null;
  const cleanAppId = appId.toLowerCase();
  const cleanDeployId = deploymentId.toLowerCase();
  const tag = `nebula-app-${cleanAppId}:${cleanDeployId}`;
  const containerName = isPreview
    ? `nebula-preview-${previewId?.toLowerCase()}-${cleanDeployId.slice(0, 8)}`
    : `nebula-app-${cleanAppId}-${cleanDeployId.slice(0, 8)}`;

  let newContainerId: string | undefined;

  console.log(
    `[Builder] Starting deployment ${deploymentId} for app ${appId} (isPreview=${isPreview})`
  );

  try {
    const labelFilter = isPreview
      ? `nebula.preview.id=${previewId}`
      : `nebula.app.id=${appId}`;
    const labeledContainers = await listContainersByLabel(labelFilter);
    existingContainers = isPreview
      ? labeledContainers
      : labeledContainers.filter((container) => !container.Labels?.["nebula.preview.id"] && !container.Labels?.["ShipLane.preview.id"]);
    appRecord = await prisma.application.findUnique({ where: { id: appId } });
    if (!appRecord) throw new Error("Application no longer exists.");
    subdomain = appRecord.subdomain;
    if (isPreview && previewId) {
      const preview = await prisma.previewEnvironment.findUnique({
        where: { id: previewId },
      });
      subdomain = preview?.previewSubdomain;
    }

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "ANALYZING",
        currentStep: "ANALYZING",
        startedAt: new Date(),
      },
    });

    if (rawSourceDir.startsWith("deployments/")) {
      sourceDir = await materializeArchive(rawSourceDir);
      temporarySourceRoot = path.dirname(sourceDir);
      await saveLog(deploymentId, "stdout", "[Nebula] Source archive downloaded and validated.");
    } else if (
      rawSourceDir.startsWith("http://") ||
      rawSourceDir.startsWith("https://") ||
      rawSourceDir.startsWith("git@") ||
      rawSourceDir.endsWith(".git")
    ) {
      if (!isAllowedGitSource(rawSourceDir)) {
        throw new Error("Only public GitHub HTTPS or SSH repository URLs are supported.");
      }
      temporarySourceRoot = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), "nebula-git-")
      );
      await saveLog(deploymentId, "stdout", "[Nebula] Cloning GitHub repository...");
      execFileSync("git", ["clone", "--depth", "1", rawSourceDir, "."], {
        cwd: temporarySourceRoot,
        stdio: "ignore",
        timeout: 120_000,
      });
      sourceDir = temporarySourceRoot;
      await saveLog(deploymentId, "stdout", "[Nebula] Repository cloned successfully.");
    }

    // -----------------------------------------------------------------------
    // STEP 1: ANALYZING
    // -----------------------------------------------------------------------
    console.log(`[Builder] [${deploymentId}] Step 1: ANALYZING`);

    const spec: ProjectSpec = await analyzeProject(sourceDir);
    console.log(
      `[Builder] [${deploymentId}] Detected: runtime=${spec.runtime}, framework=${spec.framework}, port=${spec.port}`
    );

    if (spec.hazards.length > 0) {
      console.warn(`[Builder] [${deploymentId}] Hazards detected:`, spec.hazards);
    }

    // -----------------------------------------------------------------------
    // STEP 2: BUILDING
    // -----------------------------------------------------------------------
    console.log(`[Builder] [${deploymentId}] Step 2: BUILDING`);
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: "BUILDING", currentStep: "BUILDING" },
    });

    const dockerfilePath = path.join(sourceDir, "Dockerfile");
    if (spec.runtime !== "dockerfile" && !fs.existsSync(dockerfilePath)) {
      const dockerfile = generateDockerfile(spec);
      fs.writeFileSync(dockerfilePath, dockerfile, "utf8");
      console.log(
        `[Builder] [${deploymentId}] Generated ${spec.runtime} Dockerfile`
      );
      await saveLog(
        deploymentId,
        "stdout",
        `[ShipLane] Auto-generated Dockerfile for runtime: ${spec.runtime}`
      );
    } else {
      await saveLog(deploymentId, "stdout", "[ShipLane] Using existing Dockerfile");
    }

    const buildLogger = makeLogger(deploymentId, `[Builder][${deploymentId}]`);
    await buildImage(sourceDir, tag, "Dockerfile", buildLogger);
    await saveLog(deploymentId, "stdout", `[ShipLane] Image built and tagged: ${tag}`);

    // -----------------------------------------------------------------------
    // STEP 3: RELEASING
    // -----------------------------------------------------------------------
    console.log(`[Builder] [${deploymentId}] Step 3: RELEASING`);
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: "RELEASING", currentStep: "RELEASING" },
    });

    // Fetch and decrypt environment variables
    const envRecords = await prisma.environmentVariable.findMany({
      where: {
        applicationId: appId,
        ...(isPreview ? {} : { isPreviewOnly: false }),
      },
    });

    const envArray: string[] = [];
    for (const record of envRecords) {
      try {
        const plaintext = decryptSecret(
          record.encryptedValue,
          record.iv,
          record.authTag
        );
        envArray.push(`${record.name}=${plaintext}`);
      } catch (err) {
        console.error(
          `[Builder] Failed to decrypt env var ${record.name}:`,
          err
        );
        await saveLog(
          deploymentId,
          "stderr",
          `[Nebula] Warning: Failed to decrypt env var ${record.name}`
        );
      }
    }

    // Explicitly inject container network and port environment variables
    if (!envArray.some((e) => e.startsWith("PORT="))) {
      envArray.push(`PORT=${spec.port}`);
    }
    if (!envArray.some((e) => e.startsWith("HOST="))) {
      envArray.push("HOST=0.0.0.0");
    }
    if (!envArray.some((e) => e.startsWith("NODE_ENV="))) {
      envArray.push("NODE_ENV=production");
    }

    const domain = process.env.NEBULA_DOMAIN || "nebula.local";

    // Build Traefik labels for auto-routing
    const traefikLabels: Record<string, string> = {
      "traefik.enable": "true",
      "nebula.managed": "true",
      "nebula.app.id": appId,
      ...(isPreview && previewId ? { "nebula.preview.id": previewId } : {}),
    };

    newContainerId = await runContainer({
      image: tag,
      name: containerName,
      port: spec.port,
      env: envArray,
      memoryLimitMB: 512,
      cpuLimit: 1,
      labels: traefikLabels,
      appId,
    });

    console.log(
      `[Builder] [${deploymentId}] Container started: ${newContainerId}`
    );
    await saveLog(
      deploymentId,
      "stdout",
      `[Nebula] Container started: ${newContainerId.substring(0, 12)}`
    );

    // Health-check the candidate directly before changing the live route.
    containerIp = await getContainerIp(
      newContainerId,
      `nebula-net-${cleanAppId}`
    );
    if (!containerIp) throw new Error("Could not obtain the candidate container address.");

    // -----------------------------------------------------------------------
    // STEP 4: HEALTH_CHECK
    // -----------------------------------------------------------------------
    console.log(`[Builder] [${deploymentId}] Step 4: HEALTH_CHECK`);
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: "HEALTH_CHECK", currentStep: "HEALTH_CHECK" },
    });

    const healthUrl = `http://${containerIp}:${spec.port}/`;

    await saveLog(
      deploymentId,
      "stdout",
      `[ShipLane] Health checking: ${healthUrl}`
    );
    const isHealthy = await pollUrl(healthUrl, 10, 3000);

    // -----------------------------------------------------------------------
    // STEP 5: LIVE or FAILED
    // -----------------------------------------------------------------------
    if (isHealthy) {
      if (!subdomain) throw new Error("No application hostname is configured.");
      if (isPreview && previewId) {
        await writePreviewRouteConfig(previewId, subdomain, containerIp, spec.port);
      } else {
        await writeRouteConfig(appId, subdomain, containerIp, spec.port);
      }
      routeSwitched = true;

      console.log(`[Builder] [${deploymentId}] Deployment LIVE`);
      const publicUrl = `https://${subdomain}.${domain}`;
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: "LIVE",
          currentStep: null,
          url: publicUrl,
          finishedAt: new Date(),
        },
      });
      await prisma.application.update({
        where: { id: appId },
        data: {
          status: "running",
          currentInstances: 1,
          runtime: spec.runtime,
          framework: spec.framework ?? null,
          buildCommand: spec.buildCommand ?? null,
          startCommand: spec.startCommand ?? null,
          port: spec.port,
        },
      });
      if (isPreview && previewId) {
        await prisma.previewEnvironment.update({
          where: { id: previewId },
          data: { status: "LIVE" },
        });
      }
      await saveLog(
        deploymentId,
        "stdout",
        `[ShipLane] ✓ Deployment live at ${publicUrl}`
      );

      // Keep the previous version available until the candidate is healthy and routed.
      for (const previous of existingContainers) {
        if (previous.Id !== newContainerId && previous.State === "running") {
          await stopAndRemoveContainer(previous.Id);
        }
      }

      // Automated security scan
      try {
        await saveLog(
          deploymentId,
          "stdout",
          `[ShipLane] Running automated security scan...`
        );
        await runSecurityScan(deploymentId, publicUrl);
        await saveLog(
          deploymentId,
          "stdout",
          `[ShipLane] Automated security scan completed.`
        );
      } catch (scanErr) {
        const scanErrMsg =
          scanErr instanceof Error ? scanErr.message : String(scanErr);
        console.warn(
          `[Builder] [${deploymentId}] Security scan failed to complete:`,
          scanErrMsg
        );
        await saveLog(
          deploymentId,
          "stderr",
          `[ShipLane] Warning: Security scan failed: ${scanErrMsg}`
        );
      }
    } else {
      throw new Error(
        "App failed to start or respond to health checks."
      );
    }
  } catch (error) {
    console.error(
      `[Builder] [${deploymentId}] Deployment attempt failed (${error instanceof Error ? error.name : typeof error}).`
    );

    if (routeSwitched && appRecord && subdomain) {
      try {
        const previous = existingContainers.find(
          (container) => container.State === "running" && container.Id !== newContainerId
        );
        if (previous) {
          const previousIp = await getContainerIp(previous.Id, `nebula-net-${cleanAppId}`);
          const previousPort = previous.Ports?.find((port) => port.PrivatePort)?.PrivatePort ?? appRecord.port;
          if (previousIp) {
            if (isPreview && previewId) {
              await writePreviewRouteConfig(previewId, subdomain, previousIp, previousPort);
            } else {
              await writeRouteConfig(appId, subdomain, previousIp, previousPort);
            }
          }
        } else if (isPreview && previewId) {
          await deletePreviewRouteConfig(previewId);
        } else {
          await deleteRouteConfig(appId);
        }
      } catch {
        console.error(`[Builder] [${deploymentId}] Failed to restore the previous route.`);
      }
    }

    const deploymentRecord = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });
    const failedStep = deploymentRecord?.currentStep || "UNKNOWN";
    const maxAttempts = Number(job.opts.attempts) || 1;
    const willRetry = job.attemptsMade + 1 < maxAttempts;
    const safeSummary = deploymentFailureSummary(error, failedStep);

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: willRetry ? "QUEUED" : "FAILED",
        currentStep: willRetry ? "QUEUED" : null,
        failedStep,
        errorSummary: willRetry ? `Attempt ${job.attemptsMade + 1} failed; retrying.` : safeSummary,
        finishedAt: willRetry ? null : new Date(),
      },
    });

    const hasPreviousVersion = existingContainers.some(
      (container) => container.State === "running" && container.Id !== newContainerId
    );
    await prisma.application.update({
      where: { id: appId },
      data: hasPreviousVersion
        ? { status: "running", currentInstances: 1 }
        : willRetry
          ? { status: "deploying", currentInstances: 0 }
          : { status: "failed", currentInstances: 0 },
    });

    if (!willRetry && isPreview && previewId) {
      await prisma.previewEnvironment.update({
        where: { id: previewId },
        data: { status: "EXPIRED" },
      });
    }

    try {
      await saveLog(
        deploymentId,
        "stderr",
        `[ShipLane] Deployment attempt ${job.attemptsMade + 1} failed at ${failedStep}. ${safeSummary}`
      );
    } catch {
      // Non-fatal
    }

    if (newContainerId) {
      console.log(`[Builder] Cleaning up failed container: ${newContainerId}`);
      await stopAndRemoveContainer(newContainerId).catch(() => {});
    }

    throw error; // Let BullMQ handle retries / failure tracking
  } finally {
    if (temporarySourceRoot && fs.existsSync(temporarySourceRoot)) {
      try {
        fs.rmSync(temporarySourceRoot, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.warn(
          `[Builder] Failed to clean up temporary source directory for deployment ${deploymentId}:`,
          cleanupErr
        );
      }
    }
  }
}

async function processDeploymentWithAppLock(
  job: Job<DeploymentJobPayload>
): Promise<void> {
  const lockKey = `nebula:deployment-lock:${job.data.appId}`;
  const lockOwner = `${process.pid}:${job.id}:${Date.now()}`;
  const lockTtlMs = 120_000;
  const waitUntil = Date.now() + 30 * 60_000;

  while (true) {
    const acquired = await redisConnection.set(
      lockKey,
      lockOwner,
      "PX",
      lockTtlMs,
      "NX"
    );
    if (acquired === "OK") break;
    if (Date.now() >= waitUntil) {
      throw new Error("Another deployment for this application is still running.");
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  const renewScript =
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('pexpire', KEYS[1], ARGV[2]) else return 0 end";
  const releaseScript =
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
  const heartbeat = setInterval(() => {
    void redisConnection
      .eval(renewScript, 1, lockKey, lockOwner, String(lockTtlMs))
      .catch(() => undefined);
  }, Math.floor(lockTtlMs / 3));

  try {
    await processDeployment(job);
  } finally {
    clearInterval(heartbeat);
    await redisConnection
      .eval(releaseScript, 1, lockKey, lockOwner)
      .catch(() => undefined);
  }
}

// ---------------------------------------------------------------------------
// BullMQ Worker
// ---------------------------------------------------------------------------
const worker = new Worker<DeploymentJobPayload>(
  "nebula-deployments",
  processDeploymentWithAppLock,
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

worker.on("completed", (job) => {
  console.log(`[Builder] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`[Builder] Job ${job?.id} failed (${err.name}).`);
  if (!job || job.attemptsMade < (Number(job.opts.attempts) || 1)) return;

  const deploymentId = job.data.deploymentId;
  if (!deploymentId) return;

  void (async () => {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: { applicationId: true, status: true },
    });
    if (!deployment || deployment.status === "LIVE" || deployment.status === "CANCELLED") return;

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "FAILED",
        currentStep: null,
        failedStep: "WORKER",
        errorSummary: "The deployment worker stopped before the deployment completed.",
        finishedAt: new Date(),
      },
    });

    const previousLive = await prisma.deployment.findFirst({
      where: { applicationId: deployment.applicationId, status: "LIVE" },
      select: { id: true },
    });
    await prisma.application.update({
      where: { id: deployment.applicationId },
      data: previousLive
        ? { status: "running", currentInstances: 1 }
        : { status: "failed", currentInstances: 0 },
    });
  })().catch(() => {
    console.error(`[Builder] Could not persist terminal state for job ${job.id}.`);
  });
});

worker.on("error", (err) => {
  console.error("[Builder] Worker error:", err.message);
});

console.log("[Builder] Worker started, listening on 'nebula-deployments' queue...");

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
async function shutdown() {
  console.log("[Builder] Received shutdown signal, draining queue...");
  await worker.close();
  await redisConnection.quit();
  console.log("[Builder] Worker shut down cleanly.");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { queueDeploymentJob } from "@/lib/queue";
import { uploadBuffer } from "@/lib/storage";
import { normalizeDeploymentArchive } from "@/lib/archive";
import {
  authenticateRequest,
  handleApiError,
  verifyAppOwnership,
  ApiError,
} from "@/lib/auth-middleware";

const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
const MAX_ENV_BYTES = 128 * 1024;

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_ARCHIVE_BYTES + 1024 * 1024) {
      throw new ApiError("Deployment archive exceeds the 100 MB limit", "ARCHIVE_TOO_LARGE", 413);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new ApiError(
        "Invalid multipart/form-data payload",
        "INVALID_MULTIPART",
        400
      );
    }

    const applicationId = formData.get("applicationId")?.toString();
    if (!applicationId) {
      throw new ApiError("applicationId is required", "MISSING_FIELD", 400);
    }

    // 1. Validate ownership
    const application = await verifyAppOwnership(applicationId, auth.accountId);

    const archive = formData.get("archive");
    if (!archive || !(archive instanceof Blob)) {
      throw new ApiError(
        "archive file is required as a multipart file field",
        "MISSING_ARCHIVE",
        400
      );
    }

    const forceParam = formData.get("force");
    const force =
      forceParam === "true" || forceParam === "1" || forceParam === "on";

    if (archive.size === 0) {
      throw new ApiError("Deployment archive is empty", "EMPTY_ARCHIVE", 400);
    }
    if (archive.size > MAX_ARCHIVE_BYTES) {
      throw new ApiError("Deployment archive exceeds the 100 MB limit", "ARCHIVE_TOO_LARGE", 413);
    }

    const envField = formData.get("env");
    let envObj = Object.create(null) as Record<string, string>;
    if (envField !== null) {
      if (typeof envField !== "string" || Buffer.byteLength(envField, "utf8") > MAX_ENV_BYTES) {
        throw new ApiError("Environment payload is invalid or too large", "INVALID_ENV_JSON", 400);
      }
      try {
        const parsed: unknown = JSON.parse(envField);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Environment payload must be an object");
        }
        envObj = Object.create(null) as Record<string, string>;
        for (const [name, value] of Object.entries(parsed)) {
          if (
            !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(name) ||
            ["__proto__", "prototype", "constructor"].includes(name) ||
            typeof value !== "string"
          ) {
            throw new Error("Environment entries must have valid names and string values");
          }
          envObj[name] = value;
        }
      } catch {
        throw new ApiError("env must be a JSON object of string values with valid variable names", "INVALID_ENV_JSON", 400);
      }
    }

    // 2. Read and normalize archive (.tar.gz or .zip)
    const arrayBuffer = await archive.arrayBuffer();
    let buffer: Buffer;
    try {
      buffer = await normalizeDeploymentArchive(Buffer.from(arrayBuffer));
    } catch (err) {
      throw new ApiError(
        err instanceof Error ? err.message : "Upload a .zip or .tar.gz archive",
        "INVALID_ARCHIVE_FORMAT",
        415
      );
    }

    // 3. Calculate SHA-256 hash
    const sourceHash = crypto.createHash("sha256").update(buffer).digest("hex");

    // 4. Idempotency Check
    if (!force) {
      const lastSuccessful = await prisma.deployment.findFirst({
        where: {
          applicationId,
          status: "LIVE",
        },
        orderBy: { createdAt: "desc" },
      });

      if (lastSuccessful && lastSuccessful.sourceHash === sourceHash) {
        return NextResponse.json({ status: "unchanged" }, { status: 200 });
      }
    }

    // 6. Create Deployment record with status QUEUED
    const deployment = await prisma.deployment.create({
      data: {
        applicationId,
        sourceHash,
        status: "QUEUED",
        currentStep: "QUEUED",
      },
    });

    const deploymentId = deployment.id;
    const minioObjectKey = `deployments/${applicationId}/${deploymentId}.tar.gz`;

    // 5. Upload archive to MinIO
    try {
      await uploadBuffer(minioObjectKey, buffer, "application/gzip");
    } catch (storageError) {
      console.error("[Deploy] Storage upload failed:", storageError);
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: "FAILED",
          errorSummary: "Failed to store deployment archive",
        },
      });
      throw new ApiError(
        "Failed to store deployment archive",
        "STORAGE_ERROR",
        500
      );
    }

    // 7. Store environment values encrypted; only names ever leave this route.
    for (const [name, value] of Object.entries(envObj)) {
      const enc = encryptSecret(value);
      await prisma.environmentVariable.upsert({
        where: { applicationId_name: { applicationId, name } },
        update: {
          encryptedValue: enc.ciphertext,
          iv: enc.iv,
          authTag: enc.authTag,
          source: "USER",
        },
        create: {
          applicationId,
          name,
          encryptedValue: enc.ciphertext,
          iv: enc.iv,
          authTag: enc.authTag,
          source: "USER",
        },
      });
    }

    // Mark before queueing so a fast worker cannot be overwritten by a late update.
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "deploying" },
    });

    // 8. Queue deployment job
    try {
      await queueDeploymentJob(applicationId, deploymentId, minioObjectKey);
    } catch {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: application.status },
      });
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: "FAILED",
          currentStep: null,
          failedStep: "QUEUED",
          errorSummary: "The deployment could not be added to the worker queue.",
          finishedAt: new Date(),
        },
      });
      throw new ApiError("The deployment could not be queued. Please retry.", "QUEUE_ERROR", 503);
    }

    // 9. Return 202
    return NextResponse.json(
      {
        taskId: deploymentId,
        status: "queued",
        watchUrl: `/api/v1/deployments/${deploymentId}`,
      },
      { status: 202 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { queuePreviewJob } from "@/lib/queue";
import {
  authenticateRequest,
  handleApiError,
  verifyAppOwnership,
  ApiError,
} from "@/lib/auth-middleware";

const createPreviewSchema = z.object({
  applicationId: z.string().min(1, "applicationId is required"),
  branch: z.string().min(1, "branch is required"),
});

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      throw new ApiError("applicationId query parameter is required", "MISSING_FIELD", 400);
    }

    await verifyAppOwnership(applicationId, auth.accountId);

    const previews = await prisma.previewEnvironment.findMany({
      where: {
        applicationId,
        status: { not: "DESTROYED" },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ previews }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const body = await request.json().catch(() => ({}));
    const parsed = createPreviewSchema.parse(body);

    await verifyAppOwnership(parsed.applicationId, auth.accountId);

    const sanitizedBranch = parsed.branch
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 20);

    const randomSuffix = crypto.randomBytes(3).toString("hex");
    const previewSubdomain = `pr-${sanitizedBranch}-${randomSuffix}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const preview = await prisma.previewEnvironment.create({
      data: {
        applicationId: parsed.applicationId,
        branch: parsed.branch,
        previewSubdomain,
        status: "CREATING",
        expiresAt,
      },
    });

    // Queue preview deployment job
    try {
      const sourcePath = `previews/${parsed.applicationId}/${preview.id}`;
      await queuePreviewJob(parsed.applicationId, preview.id, sourcePath);
    } catch (err) {
      console.warn(`[Previews] Queue preview job failed for ${preview.id}:`, err);
    }

    return NextResponse.json({ preview }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

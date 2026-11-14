import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  authenticateRequest,
  handleApiError,
  verifyAppOwnership,
  ApiError,
} from "@/lib/auth-middleware";

const patchScalingSchema = z.object({
  applicationId: z.string().min(1, "applicationId is required"),
  enabled: z.boolean(),
  minInstances: z.number().int().min(0).optional(),
  maxInstances: z.number().int().min(1).optional(),
});

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      throw new ApiError("applicationId query parameter is required", "MISSING_FIELD", 400);
    }

    const app = await verifyAppOwnership(applicationId, auth.accountId);

    return NextResponse.json(
      {
        scaling: {
          applicationId: app.id,
          scalingEnabled: app.scalingEnabled,
          minInstances: app.minInstances,
          maxInstances: app.maxInstances,
          currentInstances: app.currentInstances,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const body = await request.json().catch(() => ({}));
    const parsed = patchScalingSchema.parse(body);

    await verifyAppOwnership(parsed.applicationId, auth.accountId);

    if (
      parsed.minInstances !== undefined &&
      parsed.maxInstances !== undefined &&
      parsed.minInstances > parsed.maxInstances
    ) {
      throw new ApiError(
        "minInstances cannot exceed maxInstances",
        "INVALID_SCALING_BOUNDS",
        400
      );
    }

    const updated = await prisma.application.update({
      where: { id: parsed.applicationId },
      data: {
        scalingEnabled: parsed.enabled,
        ...(parsed.minInstances !== undefined
          ? { minInstances: parsed.minInstances }
          : {}),
        ...(parsed.maxInstances !== undefined
          ? { maxInstances: parsed.maxInstances }
          : {}),
      },
      select: {
        id: true,
        scalingEnabled: true,
        minInstances: true,
        maxInstances: true,
        currentInstances: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        application: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

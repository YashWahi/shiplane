import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  authenticateRequest,
  handleApiError,
  verifyAppOwnership,
  ApiError,
} from "@/lib/auth-middleware";

const updateApplicationSchema = z.object({
  name: z.string().min(1).optional(),
  buildCommand: z.string().nullable().optional(),
  startCommand: z.string().nullable().optional(),
  rootDirectory: z.string().nullable().optional(),
  port: z.number().int().positive().optional(),
  scalingEnabled: z.boolean().optional(),
  minInstances: z.number().int().min(0).optional(),
  maxInstances: z.number().int().min(1).optional(),
  runtime: z.string().nullable().optional(),
  framework: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    const { id } = await context.params;

    const application = await prisma.application.findFirst({
      where: {
        id,
        accountId: auth.accountId,
        status: { not: "deleted" },
      },
      include: {
        deployments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        databases: true,
        domains: true,
        previews: {
          where: { status: { not: "DESTROYED" } },
        },
        _count: {
          select: {
            secrets: true,
          },
        },
      },
    });

    if (!application) {
      throw new ApiError("Application not found", "NOT_FOUND", 404);
    }

    return NextResponse.json({ application }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    const { id } = await context.params;
    await verifyAppOwnership(id, auth.accountId);

    const body = await request.json().catch(() => ({}));
    const parsed = updateApplicationSchema.parse(body);

    const updated = await prisma.application.update({
      where: { id },
      data: parsed,
    });

    return NextResponse.json({ application: updated }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    const { id } = await context.params;
    await verifyAppOwnership(id, auth.accountId);

    await prisma.application.update({
      where: { id },
      data: { status: "deleted" },
    });

    return NextResponse.json(
      { success: true, message: "Application deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

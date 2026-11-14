import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateRequest,
  handleApiError,
  ApiError,
} from "@/lib/auth-middleware";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    const { id } = await context.params;

    const preview = await prisma.previewEnvironment.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            accountId: true,
          },
        },
        deployments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!preview || preview.application.accountId !== auth.accountId) {
      throw new ApiError("Preview environment not found", "NOT_FOUND", 404);
    }

    return NextResponse.json({ preview }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    const { id } = await context.params;

    const preview = await prisma.previewEnvironment.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            accountId: true,
          },
        },
      },
    });

    if (!preview || preview.application.accountId !== auth.accountId) {
      throw new ApiError("Preview environment not found", "NOT_FOUND", 404);
    }

    await prisma.previewEnvironment.update({
      where: { id },
      data: {
        status: "DESTROYED",
        destroyedAt: new Date(),
      },
    });

    return NextResponse.json(
      { success: true, message: "Preview environment destroyed" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

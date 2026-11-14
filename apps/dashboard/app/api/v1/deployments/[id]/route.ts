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

    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            accountId: true,
            name: true,
            subdomain: true,
          },
        },
        logs: {
          orderBy: { timestamp: "asc" },
          take: 200,
        },
      },
    });

    if (!deployment || deployment.application.accountId !== auth.accountId) {
      throw new ApiError("Deployment not found", "NOT_FOUND", 404);
    }

    return NextResponse.json({ deployment }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

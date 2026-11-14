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

    const scan = await prisma.securityScan.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            accountId: true,
          },
        },
        findings: true,
      },
    });

    if (!scan || scan.application.accountId !== auth.accountId) {
      throw new ApiError("Security scan not found", "NOT_FOUND", 404);
    }

    return NextResponse.json({ scan }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

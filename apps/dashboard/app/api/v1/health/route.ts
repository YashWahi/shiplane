import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateRequest,
  handleApiError,
  verifyAppOwnership,
  ApiError,
} from "@/lib/auth-middleware";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      throw new ApiError("applicationId query parameter is required", "MISSING_FIELD", 400);
    }

    await verifyAppOwnership(applicationId, auth.accountId);

    const latestCheck = await prisma.healthCheck.findFirst({
      where: { applicationId },
      orderBy: { checkedAt: "desc" },
    });

    if (!latestCheck) {
      return NextResponse.json(
        {
          health: {
            applicationId,
            status: "UNKNOWN",
            message: "No health checks recorded yet",
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ health: latestCheck }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listContainersByLabel, getContainerStats } from "@/lib/docker";
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

    const app = await verifyAppOwnership(applicationId, auth.accountId);

    let cpuPercent = 0;
    let memoryUsageMB = 0;
    let containerStatus = "stopped";

    try {
      let containers = await listContainersByLabel(`nebula.app.id=${applicationId}`);
      if (!containers || containers.length === 0) {
        containers = await listContainersByLabel(`ShipLane.appId=${applicationId}`);
      }
      const running = containers.find((c) => c.State === "running");

      if (running) {
        containerStatus = "running";
        const stats = await getContainerStats(running.Id);
        cpuPercent = stats.cpuPercent;
        memoryUsageMB = stats.memoryUsageMB;
      }
    } catch (dockerErr) {
      console.warn(`[Metrics] Error fetching stats for ${applicationId}:`, dockerErr);
    }

    return NextResponse.json(
      {
        metrics: {
          applicationId: app.id,
          status: containerStatus,
          cpuPercent,
          memoryUsageMB,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

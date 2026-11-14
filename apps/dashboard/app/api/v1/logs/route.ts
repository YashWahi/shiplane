import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { docker, listContainersByLabel } from "@/lib/docker";
import {
  authenticateRequest,
  handleApiError,
  verifyAppOwnership,
  ApiError,
} from "@/lib/auth-middleware";

/**
 * Strips Docker multiplexing 8-byte headers from log streams if present.
 */
function cleanDockerLogs(buffer: Buffer): string[] {
  const lines: string[] = [];
  let offset = 0;

  // Check if buffer starts with Docker stream header: [1 or 2, 0, 0, 0, size1, size2, size3, size4]
  const isMultiplexed =
    buffer.length >= 8 &&
    (buffer[0] === 1 || buffer[0] === 2) &&
    buffer[1] === 0 &&
    buffer[2] === 0 &&
    buffer[3] === 0;

  if (isMultiplexed) {
    while (offset < buffer.length) {
      if (offset + 8 > buffer.length) break;
      const size = buffer.readUInt32BE(offset + 4);
      offset += 8;
      const chunk = buffer.subarray(offset, offset + size).toString("utf8");
      offset += size;
      for (const line of chunk.split(/\r?\n/)) {
        if (line.trim().length > 0) {
          lines.push(line);
        }
      }
    }
  } else {
    const raw = buffer.toString("utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (line.trim().length > 0) {
        lines.push(line);
      }
    }
  }

  return lines;
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");
    const tailParam = searchParams.get("tail");
    const format = searchParams.get("format") || "json";
    const tail = tailParam ? Math.min(Math.max(parseInt(tailParam, 10), 1), 1000) : 100;

    if (!applicationId) {
      throw new ApiError("applicationId query parameter is required", "MISSING_FIELD", 400);
    }

    await verifyAppOwnership(applicationId, auth.accountId);

    let logs: string[] = [];

    // 1. Try to fetch live container logs from Docker
    try {
      let containers = await listContainersByLabel(`nebula.app.id=${applicationId}`);
      if (!containers || containers.length === 0) {
        containers = await listContainersByLabel(`ShipLane.appId=${applicationId}`);
      }
      if (containers && containers.length > 0) {
        const targetContainer =
          containers.find((c) => c.State === "running") || containers[0];
        const container = docker.getContainer(targetContainer.Id);
        const logBuffer = (await container.logs({
          stdout: true,
          stderr: true,
          tail,
          timestamps: true,
        })) as Buffer;

        if (Buffer.isBuffer(logBuffer)) {
          logs = cleanDockerLogs(logBuffer);
        } else if (typeof logBuffer === "string") {
          logs = (logBuffer as string).split(/\r?\n/).filter((l) => l.trim().length > 0);
        }
      }
    } catch (dockerErr) {
      console.warn(`[Logs] Docker logs lookup failed for ${applicationId}:`, dockerErr);
    }

    // 2. If no live container logs, fall back to deployment logs in database
    if (logs.length === 0) {
      const latestDeployment = await prisma.deployment.findFirst({
        where: { applicationId },
        orderBy: { createdAt: "desc" },
      });

      if (latestDeployment) {
        const dbLogs = await prisma.deploymentLog.findMany({
          where: { deploymentId: latestDeployment.id },
          orderBy: { timestamp: "asc" },
          take: tail,
        });

        logs = dbLogs.map(
          (l) => `[${l.timestamp.toISOString()}] [${l.stream}] ${l.line}`
        );
      }
    }

    if (format === "text") {
      return new Response(logs.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    return NextResponse.json({ logs, count: logs.length }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

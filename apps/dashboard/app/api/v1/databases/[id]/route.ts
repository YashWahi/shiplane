import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stopAndRemoveContainer } from "@/lib/docker";
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

    const database = await prisma.databaseInstance.findUnique({
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

    if (!database || database.application.accountId !== auth.accountId) {
      throw new ApiError("Database instance not found", "NOT_FOUND", 404);
    }

    return NextResponse.json(
      {
        database: {
          id: database.id,
          applicationId: database.applicationId,
          engine: database.engine,
          status: database.status,
          host: database.host,
          port: database.port,
          databaseName: database.databaseName,
          username: database.username,
          region: database.region,
          createdAt: database.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    const { id } = await context.params;

    const database = await prisma.databaseInstance.findUnique({
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

    if (!database || database.application.accountId !== auth.accountId) {
      throw new ApiError("Database instance not found", "NOT_FOUND", 404);
    }

    if (database.containerId) {
      try {
        await stopAndRemoveContainer(database.containerId);
      } catch (err) {
        console.warn(`[Databases] Error stopping container ${database.containerId}:`, err);
      }
    }

    await prisma.databaseInstance.update({
      where: { id },
      data: {
        status: "DELETED",
      },
    });

    return NextResponse.json(
      { success: true, message: "Database instance terminated" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

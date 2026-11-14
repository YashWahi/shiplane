import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureNetwork } from "@/lib/docker";
import {
  authenticateRequest,
  handleApiError,
  ApiError,
} from "@/lib/auth-middleware";

const createApplicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subdomain: z.string().min(1).optional(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);

    const applications = await prisma.application.findMany({
      where: {
        accountId: auth.accountId,
        status: { not: "deleted" },
      },
      include: {
        _count: {
          select: {
            deployments: true,
            databases: true,
            secrets: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const body = await request.json().catch(() => ({}));
    const parsed = createApplicationSchema.parse(body);

    let subdomain = parsed.subdomain ? slugify(parsed.subdomain) : slugify(parsed.name);
    if (!subdomain) {
      subdomain = `app-${crypto.randomBytes(4).toString("hex")}`;
    }

    const existing = await prisma.application.findUnique({
      where: { subdomain },
    });

    if (existing) {
      if (parsed.subdomain) {
        throw new ApiError(
          `Subdomain '${subdomain}' is already taken`,
          "SUBDOMAIN_CONFLICT",
          409
        );
      }
      subdomain = `${subdomain}-${crypto.randomBytes(3).toString("hex")}`;
    }

    const application = await prisma.application.create({
      data: {
        accountId: auth.accountId,
        name: parsed.name,
        subdomain,
        sourceType: "archive",
        port: 3000,
        status: "ready",
      },
    });

    // Ensure Docker network for the application
    try {
      await ensureNetwork(application.id);
    } catch (dockerError) {
      console.warn(
        `[Applications] Network creation warning for ${application.id}:`,
        dockerError instanceof Error ? dockerError.message : dockerError
      );
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

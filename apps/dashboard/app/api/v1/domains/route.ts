import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  authenticateRequest,
  handleApiError,
  verifyAppOwnership,
  ApiError,
} from "@/lib/auth-middleware";

const addDomainSchema = z.object({
  applicationId: z.string().min(1, "applicationId is required"),
  hostname: z.string().min(1, "hostname is required").toLowerCase(),
  isCustom: z.boolean().optional().default(true),
});

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      throw new ApiError("applicationId query parameter is required", "MISSING_FIELD", 400);
    }

    await verifyAppOwnership(applicationId, auth.accountId);

    const domains = await prisma.domain.findMany({
      where: { applicationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ domains }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const body = await request.json().catch(() => ({}));
    const parsed = addDomainSchema.parse(body);

    await verifyAppOwnership(parsed.applicationId, auth.accountId);

    const existing = await prisma.domain.findUnique({
      where: { hostname: parsed.hostname },
    });

    if (existing) {
      throw new ApiError("Hostname already registered", "HOSTNAME_EXISTS", 409);
    }

    const domain = await prisma.domain.create({
      data: {
        applicationId: parsed.applicationId,
        hostname: parsed.hostname,
        isCustom: parsed.isCustom,
        verificationState: "verified",
        certificateState: "active",
      },
    });

    return NextResponse.json({ domain }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

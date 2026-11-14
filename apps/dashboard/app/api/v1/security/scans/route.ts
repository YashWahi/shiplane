import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  authenticateRequest,
  handleApiError,
  verifyAppOwnership,
  ApiError,
} from "@/lib/auth-middleware";

const triggerScanSchema = z.object({
  applicationId: z.string().min(1, "applicationId is required"),
  deploymentId: z.string().optional(),
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

    const scans = await prisma.securityScan.findMany({
      where: { applicationId },
      include: {
        findings: true,
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({ scans }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const body = await request.json().catch(() => ({}));
    const parsed = triggerScanSchema.parse(body);

    const app = await verifyAppOwnership(parsed.applicationId, auth.accountId);

    let deploymentId = parsed.deploymentId;
    if (!deploymentId) {
      const latestDeployment = await prisma.deployment.findFirst({
        where: { applicationId: app.id },
        orderBy: { createdAt: "desc" },
      });

      if (!latestDeployment) {
        throw new ApiError(
          "Cannot perform security scan on an application without deployments",
          "NO_DEPLOYMENT",
          400
        );
      }
      deploymentId = latestDeployment.id;
    } else {
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
      });
      if (!deployment || deployment.applicationId !== app.id) {
        throw new ApiError("Deployment not found for this application", "NOT_FOUND", 404);
      }
    }

    // Clear existing scan for this deployment if present (deploymentId is unique)
    const existing = await prisma.securityScan.findUnique({
      where: { deploymentId },
    });
    if (existing) {
      await prisma.securityFinding.deleteMany({ where: { scanId: existing.id } });
      await prisma.securityScan.delete({ where: { id: existing.id } });
    }

    // Create scan record
    const scan = await prisma.securityScan.create({
      data: {
        applicationId: app.id,
        deploymentId,
        status: "completed",
        completedAt: new Date(),
      },
    });

    // Run security inspection rules
    const findings: Array<{
      severity: string;
      code: string;
      message: string;
      recommendation: string;
    }> = [];

    if (!app.scalingEnabled) {
      findings.push({
        severity: "low",
        code: "SEC-SCALING-001",
        message: "Autoscaling is disabled; the service is vulnerable to traffic burst denial of service",
        recommendation: "Enable autoscaling with appropriate min and max replicas in scaling settings",
      });
    }

    if (app.port < 1024) {
      findings.push({
        severity: "medium",
        code: "SEC-PORT-002",
        message: `Application uses privileged port ${app.port}`,
        recommendation: "Configure application to bind to an unprivileged port (e.g., 3000, 8080)",
      });
    }

    const secrets = await prisma.environmentVariable.findMany({
      where: { applicationId: app.id },
      select: { name: true },
    });

    const debugSecrets = secrets.filter(
      (s) => s.name.toUpperCase().includes("DEBUG")
    );
    if (debugSecrets.length > 0) {
      findings.push({
        severity: "low",
        code: "SEC-ENV-003",
        message: `Debug flag detected in environment variables: ${debugSecrets.map((s) => s.name).join(", ")}`,
        recommendation: "Ensure verbose debug logging is disabled in production environments",
      });
    }

    // Insert findings
    for (const f of findings) {
      await prisma.securityFinding.create({
        data: {
          scanId: scan.id,
          severity: f.severity,
          code: f.code,
          message: f.message,
          recommendation: f.recommendation,
        },
      });
    }

    const completedScan = await prisma.securityScan.findUnique({
      where: { id: scan.id },
      include: { findings: true },
    });

    return NextResponse.json({ scan: completedScan }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { queueDeploymentJob, queuePreviewJob } from "@/lib/queue";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader =
      request.headers.get("x-hub-signature-256") ||
      request.headers.get("X-Hub-Signature-256");
    const event =
      request.headers.get("x-github-event") ||
      request.headers.get("X-GitHub-Event");

    // Fail closed: a webhook without a configured secret must never trigger a deploy.
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "GitHub webhook is not configured" },
        { status: 503 }
      );
    }

    if (!signatureHeader) {
      return NextResponse.json(
        { error: "Missing X-Hub-Signature-256 header" },
        { status: 401 }
      );
    }

    const signatureMatch = /^sha256=([a-f0-9]{64})$/i.exec(signatureHeader);
    if (!signatureMatch) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest();
    const receivedSignature = Buffer.from(signatureMatch[1], "hex");
    if (!crypto.timingSafeEqual(expectedSignature, receivedSignature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Handle GitHub ping event only after verifying its signature.
    if (event === "ping") {
      return NextResponse.json(
        { message: "pong", status: "ok" },
        { status: 200 }
      );
    }

    // 2. Parse Payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const repoFullName = payload.repository?.full_name;
    const ref = payload.ref;

    if (!repoFullName || !ref || typeof ref !== "string") {
      return NextResponse.json(
        { status: "ignored", reason: "Missing repository or ref information" },
        { status: 200 }
      );
    }

    const commitSha =
      payload.head_commit?.id || payload.after || crypto.randomBytes(16).toString("hex");
    const commitMessage =
      payload.head_commit?.message || "Triggered via GitHub push webhook";
    const cloneUrl =
      payload.repository?.clone_url || `https://github.com/${repoFullName}.git`;

    // 3. Find Matching Applications (matches shortname or full git clone URLs)
    const matchingApps = await prisma.application.findMany({
      where: {
        OR: [
          { repository: repoFullName },
          { repository: `https://github.com/${repoFullName}` },
          { repository: `https://github.com/${repoFullName}.git` },
        ],
        status: { not: "deleted" },
      },
    });

    if (matchingApps.length === 0) {
      return NextResponse.json(
        {
          status: "ignored",
          reason: `No active applications registered for repository: ${repoFullName}`,
        },
        { status: 200 }
      );
    }

    // 4. Routing Logic
    const branch = ref.replace(/^refs\/heads\//, "");
    let deploymentsTriggered = 0;

    for (const app of matchingApps) {
      const isProductionBranch = app.branch === branch;

      if (isProductionBranch) {
        // Production deployment (if deployOnPush is enabled)
        if (app.deployOnPush) {
          const deployment = await prisma.deployment.create({
            data: {
              applicationId: app.id,
              sourceHash: commitSha,
              commitSha,
              commitMessage,
              status: "QUEUED",
              currentStep: "QUEUED",
            },
          });

          await queueDeploymentJob(app.id, deployment.id, cloneUrl);
          deploymentsTriggered++;
        }
      } else {
        // Preview deployment
        let preview = await prisma.previewEnvironment.findFirst({
          where: {
            applicationId: app.id,
            branch,
            status: { not: "DESTROYED" },
          },
        });

        if (!preview) {
          const sanitizedBranch = branch
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 20);

          const randomSuffix = crypto.randomBytes(3).toString("hex");
          const previewSubdomain = `pr-${sanitizedBranch}-${randomSuffix}`;
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

          preview = await prisma.previewEnvironment.create({
            data: {
              applicationId: app.id,
              branch,
              previewSubdomain,
              status: "CREATING",
              expiresAt,
            },
          });
        }

        const deployment = await prisma.deployment.create({
          data: {
            applicationId: app.id,
            previewId: preview.id,
            isPreview: true,
            sourceHash: commitSha,
            commitSha,
            commitMessage,
            status: "QUEUED",
            currentStep: "QUEUED",
          },
        });

        await queuePreviewJob(app.id, preview.id, cloneUrl);
        deploymentsTriggered++;
      }
    }

    // 5. Response
    return NextResponse.json(
      {
        status: "queued",
        deployments_triggered: deploymentsTriggered,
      },
      { status: 200 }
    );
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error("[GitHub Webhook Error]", err);
    return NextResponse.json(
      { error: "Internal server error processing webhook" },
      { status: 500 }
    );
  }
}

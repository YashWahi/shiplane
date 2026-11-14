import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/crypto";
import { handleApiError } from "@/lib/auth-middleware";

const tokenSchema = z.object({
  device_code: z.string().min(1, "device_code is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { device_code } = tokenSchema.parse(body);

    const record = await prisma.deviceCode.findUnique({
      where: { deviceCode: device_code },
    });

    if (!record) {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json({ error: "expired_token" }, { status: 400 });
    }

    if (record.status === "authorization_pending") {
      return NextResponse.json({ error: "authorization_pending" }, { status: 400 });
    }

    if (record.status === "denied") {
      return NextResponse.json({ error: "access_denied" }, { status: 400 });
    }

    if (record.status === "approved") {
      if (!record.accountId) {
        return NextResponse.json(
          { error: "invalid_grant", message: "No account linked to device code" },
          { status: 400 }
        );
      }

      // Generate new API key
      const keyResult = generateApiKey("neb_live");

      await prisma.$transaction([
        prisma.apiKey.create({
          data: {
            accountId: record.accountId,
            name: record.clientId ? `CLI (${record.clientId})` : "Device Authorization Token",
            hashedKey: keyResult.hashedKey,
            prefix: keyResult.prefix,
            scopes: record.scopes || "read write",
          },
        }),
        prisma.deviceCode.update({
          where: { id: record.id },
          data: { status: "consumed" },
        }),
      ]);

      return NextResponse.json(
        {
          access_token: keyResult.rawKey,
          token_type: "bearer",
          expires_in: 31536000,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateUserCode } from "@/lib/crypto";
import { handleApiError } from "@/lib/auth-middleware";

const requestSchema = z.object({
  scopes: z.string().optional().default("read write"),
  client_name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = requestSchema.parse(body);

    const deviceCode = crypto.randomBytes(32).toString("hex");
    const userCode = generateUserCode();
    const expiresIn = 900; // 15 mins in seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.deviceCode.create({
      data: {
        deviceCode,
        userCode,
        scopes: parsed.scopes,
        clientId: parsed.client_name || null,
        status: "authorization_pending",
        expiresAt,
      },
    });

    const verificationUri = process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/activate`
      : "https://ShipLane.app/activate";

    return NextResponse.json(
      {
        device_code: deviceCode,
        user_code: userCode,
        verification_uri: verificationUri,
        expires_in: expiresIn,
        interval: 5,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import {
  authenticateRequest,
  handleApiError,
  verifyAppOwnership,
  ApiError,
} from "@/lib/auth-middleware";

const putSecretsSchema = z.object({
  applicationId: z.string().min(1, "applicationId is required"),
  variables: z.record(z.string()).refine(
    (vars) => Object.keys(vars).length > 0,
    "variables object must contain at least one key-value pair"
  ),
});

const deleteSecretsSchema = z.object({
  applicationId: z.string().min(1, "applicationId is required"),
  names: z.array(z.string().min(1)).min(1, "names array must contain at least one variable name"),
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

    const variables = await prisma.environmentVariable.findMany({
      where: { applicationId },
      select: {
        name: true,
      },
      orderBy: { name: "asc" },
    });

    // CRITICAL: Return ONLY variable names, never values
    return NextResponse.json(
      { variables: variables.map((v) => v.name) },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const body = await request.json().catch(() => ({}));
    const parsed = putSecretsSchema.parse(body);

    await verifyAppOwnership(parsed.applicationId, auth.accountId);

    const namesSet: string[] = [];

    for (const [name, value] of Object.entries(parsed.variables)) {
      const encrypted = encryptSecret(value);
      await prisma.environmentVariable.upsert({
        where: {
          applicationId_name: {
            applicationId: parsed.applicationId,
            name,
          },
        },
        update: {
          encryptedValue: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          source: "USER",
        },
        create: {
          applicationId: parsed.applicationId,
          name,
          encryptedValue: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          source: "USER",
        },
      });
      namesSet.push(name);
    }

    // CRITICAL: Never return the values in the response. Return { set: ["VAR1", "VAR2"] }
    return NextResponse.json({ set: namesSet }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authenticateRequest(request);

    let applicationId: string | null = null;
    let names: string[] = [];

    const { searchParams } = new URL(request.url);
    if (searchParams.get("applicationId") && searchParams.get("name")) {
      applicationId = searchParams.get("applicationId");
      names = [searchParams.get("name")!];
    } else {
      const body = await request.json().catch(() => ({}));
      const parsed = deleteSecretsSchema.parse(body);
      applicationId = parsed.applicationId;
      names = parsed.names;
    }

    if (!applicationId || names.length === 0) {
      throw new ApiError(
        "applicationId and secret name(s) are required",
        "MISSING_FIELD",
        400
      );
    }

    await verifyAppOwnership(applicationId, auth.accountId);

    const result = await prisma.environmentVariable.deleteMany({
      where: {
        applicationId,
        name: { in: names },
      },
    });

    return NextResponse.json(
      { removed: names, count: result.count },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
import { prisma } from "./prisma";
import { hashApiKey } from "./crypto";

export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, code: string = "BAD_REQUEST", statusCode: number = 400) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Creates standard JSON error response matching { error: { code, message } }
 */
export function errorResponse(
  message: string,
  code: string = "BAD_REQUEST",
  status: number = 400,
  requestId?: string
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(requestId ? { requestId } : {}),
      },
    },
    { status }
  );
}

/**
 * Formats unknown caught errors into standard JSON error responses.
 */
export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return errorResponse(error.message, error.code, error.statusCode);
  }

  if (error instanceof ZodError) {
    const formatted = error.issues
      .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
      .join(", ");
    return errorResponse(formatted, "VALIDATION_ERROR", 400);
  }

  const requestId = randomUUID();
  const errorType = error instanceof Error ? error.name : typeof error;
  console.error(`[API ${requestId}] Unexpected ${errorType}`);
  return errorResponse(
    "An unexpected error occurred.",
    "INTERNAL_ERROR",
    500,
    requestId
  );
}

/**
 * Authenticates an incoming HTTP request via Bearer token (ApiKey or approved DeviceCode).
 * Throws 401 ApiError if unauthenticated.
 */
export async function authenticateRequest(
  request: Request
): Promise<{ accountId: string; applicationId?: string }> {
  const authHeader =
    request.headers.get("authorization") || request.headers.get("Authorization");

  if (!authHeader) {
    throw new ApiError("Missing Authorization header", "UNAUTHORIZED", 401);
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new ApiError(
      "Invalid Authorization format. Expected: Bearer <token>",
      "UNAUTHORIZED",
      401
    );
  }

  const token = match[1].trim();
  if (!token) {
    throw new ApiError("Empty Bearer token", "UNAUTHORIZED", 401);
  }

  // 1. Try ApiKey lookup
  const hashedKey = hashApiKey(token);
  const apiKey = await prisma.apiKey.findUnique({
    where: { hashedKey },
  });

  if (apiKey) {
    if (apiKey.revokedAt) {
      throw new ApiError("API key has been revoked", "UNAUTHORIZED", 401);
    }

    // Update lastUsedAt asynchronously
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => console.error("[Auth] Failed to update lastUsedAt:", err));

    return { accountId: apiKey.accountId };
  }

  throw new ApiError("Invalid or revoked API key", "UNAUTHORIZED", 401);
}

/**
 * Validates that an application exists and belongs to the specified account.
 */
export async function verifyAppOwnership(applicationId: string, accountId: string) {
  const app = await prisma.application.findFirst({
    where: {
      id: applicationId,
      accountId,
      status: { not: "deleted" },
    },
  });

  if (!app) {
    throw new ApiError("Application not found", "NOT_FOUND", 404);
  }

  return app;
}


import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { normalizePrismaError } from "@/lib/db";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(
  message: string,
  code = "INTERNAL_SERVER_ERROR",
  status = 500,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Handle custom application errors
  if (error instanceof AppError) {
    return apiError(error.message, error.code, error.statusCode, error.details);
  }

  // Handle Zod schema validation errors
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return apiError(
      "Validation failed for request parameters",
      "VALIDATION_ERROR",
      400,
      issues
    );
  }

  // Handle Prisma errors
  const normalized = normalizePrismaError(error);
  if (normalized.code.startsWith("DB_") || normalized.statusCode === 409 || normalized.statusCode === 404) {
    return apiError(
      normalized.message,
      normalized.code,
      normalized.statusCode
    );
  }

  // Generic unhandled server error (sanitized for client)
  console.error("Unhandled API error:", error);
  const isDev = process.env.NODE_ENV === "development";
  const message = isDev && error instanceof Error ? error.message : "An unexpected server error occurred.";

  return apiError(message, "INTERNAL_SERVER_ERROR", 500);
}

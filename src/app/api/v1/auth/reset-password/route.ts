import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await AuthService.resetPassword(body);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  // If a browser navigates directly here, redirect to the user-facing reset password page
  const acceptHeader = req.headers.get("accept") || "";
  if (acceptHeader.includes("text/html")) {
    const url = new URL("/auth/reset-password", req.url);
    if (token) url.searchParams.set("token", token);
    return NextResponse.redirect(url);
  }

  if (!token) {
    return handleApiError(new ValidationError("Reset token is required as a query parameter."));
  }

  try {
    const result = await AuthService.validateResetToken(token);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

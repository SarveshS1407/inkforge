import { NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { forgotPasswordRateLimiter } from "@/lib/auth/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ipHeader = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    const clientIp = ipHeader ? ipHeader.split(",")[0].trim() : "127.0.0.1";
    const emailKey = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "anon";

    // Rate limiting: protect against email flooding / enumeration
    forgotPasswordRateLimiter.check(`forgot:${clientIp}:${emailKey}`);

    const result = await AuthService.requestPasswordReset(body.email);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

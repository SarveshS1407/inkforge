import { NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { setSessionCookie } from "@/lib/auth/session";
import { loginRateLimiter } from "@/lib/auth/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ipHeader = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    const clientIp = ipHeader ? ipHeader.split(",")[0].trim() : "127.0.0.1";
    const emailKey = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "anon";

    // Rate limiting: protect against credential brute-forcing
    loginRateLimiter.check(`login:${clientIp}:${emailKey}`);

    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await AuthService.login(body, { ipAddress: clientIp, userAgent });

    const response = apiSuccess(result.user, { sessionToken: result.sessionToken }, 200);
    setSessionCookie(response, result.sessionToken);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

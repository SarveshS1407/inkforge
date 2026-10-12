import { NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { setSessionCookie } from "@/lib/auth/session";
import { registerRateLimiter } from "@/lib/auth/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ipHeader = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    const clientIp = ipHeader ? ipHeader.split(",")[0].trim() : "127.0.0.1";

    // Rate limiting: protect against automated bot account creation
    registerRateLimiter.check(`register:${clientIp}`);

    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await AuthService.register(body, { ipAddress: clientIp, userAgent });

    const response = apiSuccess(result.user, { sessionToken: result.sessionToken }, 201);
    setSessionCookie(response, result.sessionToken);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { setSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await AuthService.register(body, { ipAddress, userAgent });

    const response = apiSuccess(result.user, { sessionToken: result.sessionToken }, 201);
    setSessionCookie(response, result.sessionToken);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

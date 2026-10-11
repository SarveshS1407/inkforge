import { NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { extractSessionToken } from "@/lib/auth/guard";
import { clearSessionCookie } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = extractSessionToken(req);

    if (sessionToken) {
      await AuthService.logout(sessionToken);
    }

    const response = apiSuccess({ loggedOut: true });
    clearSessionCookie(response);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

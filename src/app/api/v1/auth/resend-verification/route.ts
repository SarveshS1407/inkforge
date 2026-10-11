import { NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let email: string | undefined;

    // Check JSON body if provided
    try {
      const body = await req.json();
      if (body && typeof body.email === "string") {
        email = body.email;
      }
    } catch {
      // Body may be empty if called by authenticated session
    }

    // Fall back to session user if body has no email
    if (!email) {
      const user = await getAuthenticatedUser(req);
      if (user?.email) {
        email = user.email;
      }
    }

    if (!email) {
      return handleApiError(new Error("Email address is required."));
    }

    const result = await AuthService.resendVerification(email);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

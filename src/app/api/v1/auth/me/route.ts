import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    return apiSuccess({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      emailVerified: user.emailVerified,
      profile: user.profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

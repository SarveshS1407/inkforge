import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { UserService } from "@/lib/services/user.service";
import { UpdateProfileInput } from "@/types/api";

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

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = (await req.json()) as UpdateProfileInput;

    // Enforce ownership: update author profile using session user.id only
    const updated = await UserService.updateAuthorProfile(user.id, body);

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

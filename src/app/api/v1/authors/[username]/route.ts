import { NextRequest } from "next/server";
import { UserService } from "@/lib/services/user.service";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    const author = await UserService.getPublicAuthorByUsername(username);

    return apiSuccess(author);
  } catch (error) {
    return handleApiError(error);
  }
}

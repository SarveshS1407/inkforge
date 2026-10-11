import { NextRequest } from "next/server";
import { CollectionService } from "@/lib/services/collection.service";
import { requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { postId } = await context.params;

    const collections = await CollectionService.getUserCollectionsForPost(
      user.id,
      postId
    );

    return apiSuccess(collections);
  } catch (error) {
    return handleApiError(error);
  }
}

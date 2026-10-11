import { NextRequest } from "next/server";
import { CollectionService } from "@/lib/services/collection.service";
import { requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: collectionId, postId } = await context.params;

    const result = await CollectionService.removeItemFromCollection(
      collectionId,
      user.id,
      postId
    );

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { CollectionService } from "@/lib/services/collection.service";
import { requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: collectionId } = await context.params;
    const body = await req.json();

    const item = await CollectionService.addItemToCollection(
      collectionId,
      user.id,
      body.postId
    );

    return apiSuccess(item, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

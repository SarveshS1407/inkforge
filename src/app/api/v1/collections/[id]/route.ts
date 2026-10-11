import { NextRequest } from "next/server";
import { CollectionService } from "@/lib/services/collection.service";
import { getAuthenticatedUser, requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getAuthenticatedUser(req);
    const requesterId = user ? user.id : undefined;

    const collection = await CollectionService.getCollectionById(id, requesterId);
    return apiSuccess(collection);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await context.params;
    const body = await req.json();

    const updated = await CollectionService.updateCollection(id, user.id, {
      title: body.title,
      description: body.description,
      isPublic: body.isPublic,
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await context.params;

    const result = await CollectionService.deleteCollection(id, user.id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

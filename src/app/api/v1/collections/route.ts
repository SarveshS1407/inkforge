import { NextRequest } from "next/server";
import { CollectionService } from "@/lib/services/collection.service";
import { getAuthenticatedUser, requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authenticatedUser = await getAuthenticatedUser(req);
    const requesterId = authenticatedUser ? authenticatedUser.id : undefined;

    const mine = searchParams.get("mine") === "true";
    let ownerId = searchParams.get("ownerId") || undefined;

    if (mine) {
      if (!authenticatedUser) {
        return apiSuccess([], { total: 0, limit: 20, offset: 0 });
      }
      ownerId = authenticatedUser.id;
    }

    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : 20;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : 0;

    const result = await CollectionService.listCollections({
      ownerId,
      requesterId,
      limit,
      offset,
    });

    return apiSuccess(result.items, {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const collection = await CollectionService.createCollection(user.id, {
      title: body.title,
      description: body.description,
      isPublic: body.isPublic !== undefined ? body.isPublic : true,
    });

    return apiSuccess(collection, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

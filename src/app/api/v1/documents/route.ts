import { NextRequest } from "next/server";
import { DocumentService } from "@/lib/services/document.service";
import { getAuthenticatedUser, requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { CreateDocumentInput } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const publicationId = searchParams.get("publicationId") || undefined;
    const authorId = searchParams.get("authorId") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : 20;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : 0;

    // Resolve authenticated user from verified session cookie or bearer token
    const authenticatedUser = await getAuthenticatedUser(req);
    const requesterId = authenticatedUser ? authenticatedUser.id : undefined;

    const result = await DocumentService.listDocuments({
      requesterId,
      status,
      publicationId,
      authorId,
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
    // Enforce server-side authentication: unauthenticated writes are strictly rejected (401)
    const authenticatedUser = await requireAuth(req);

    const body = (await req.json()) as CreateDocumentInput;

    // The author is ALWAYS the verified session user; client cannot spoof or supply authorId
    const document = await DocumentService.createDocument(body, authenticatedUser.id);
    return apiSuccess(document, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

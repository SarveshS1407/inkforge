import { NextRequest } from "next/server";
import { DocumentService } from "@/lib/services/document.service";
import { getAuthenticatedUser, requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { UpdateDocumentInput } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authenticatedUser = await getAuthenticatedUser(req);
    const requesterId = authenticatedUser ? authenticatedUser.id : undefined;

    const document = await DocumentService.getDocumentById(id, requesterId);
    return apiSuccess(document);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // Strict authentication: unauthenticated updates rejected with 401
    const authenticatedUser = await requireAuth(req);

    const body = (await req.json()) as UpdateDocumentInput;

    // Strict ownership verification: authenticated user must be the document author (or 403)
    const updated = await DocumentService.updateDocument(id, body, authenticatedUser.id);
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
    const { id } = await context.params;
    // Strict authentication: unauthenticated deletes rejected with 401
    const authenticatedUser = await requireAuth(req);

    // Strict ownership verification: only author can delete (or 403)
    const result = await DocumentService.deleteDocument(id, authenticatedUser.id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

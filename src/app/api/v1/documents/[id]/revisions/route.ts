import { NextRequest } from "next/server";
import { DocumentService } from "@/lib/services/document.service";
import { requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // Strict authentication: unauthenticated revision reads rejected with 401
    const authenticatedUser = await requireAuth(req);

    // Strict ownership verification: only author can view revisions (or 403)
    const revisions = await DocumentService.getDocumentRevisions(
      id,
      authenticatedUser.id
    );
    return apiSuccess(revisions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // Strict authentication: unauthenticated revision restore rejected with 401
    const authenticatedUser = await requireAuth(req);

    const body = await req.json();
    const { revisionId } = body || {};

    if (!revisionId || typeof revisionId !== "string") {
      throw new ValidationError("revisionId is required to restore a revision.");
    }

    // Strict ownership & authorization: only document author can restore revision
    const restored = await DocumentService.restoreRevision(
      id,
      revisionId,
      authenticatedUser.id
    );

    return apiSuccess(restored);
  } catch (error) {
    return handleApiError(error);
  }
}

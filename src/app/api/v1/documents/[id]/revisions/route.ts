import { NextRequest } from "next/server";
import { DocumentService } from "@/lib/services/document.service";
import { requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

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

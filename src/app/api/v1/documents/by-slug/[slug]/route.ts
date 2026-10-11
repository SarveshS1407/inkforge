import { NextRequest } from "next/server";
import { DocumentService } from "@/lib/services/document.service";
import { getAuthenticatedUser } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const authenticatedUser = await getAuthenticatedUser(req);
    const requesterId = authenticatedUser ? authenticatedUser.id : undefined;

    const document = await DocumentService.getDocumentBySlug(slug, requesterId);
    return apiSuccess(document);
  } catch (error) {
    return handleApiError(error);
  }
}

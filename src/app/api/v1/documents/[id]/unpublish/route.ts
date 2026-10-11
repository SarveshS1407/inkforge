import { NextRequest } from "next/server";
import { DocumentService } from "@/lib/services/document.service";
import { requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authenticatedUser = await requireAuth(req);
    const body = await req.json().catch(() => ({}));

    const unpublished = await DocumentService.unpublishDocument(
      id,
      authenticatedUser.id,
      body.expectedVersion
    );

    return apiSuccess(unpublished);
  } catch (error) {
    return handleApiError(error);
  }
}

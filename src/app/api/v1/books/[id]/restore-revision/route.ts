import { NextRequest } from "next/server";
import { BookService } from "@/lib/services/book.service";
import { requireAuthor } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuthor(req);
    const body = await req.json();

    const version = typeof body.version === "number" ? body.version : parseInt(body.version, 10);
    const restored = await BookService.restoreRevision(id, version, user.id);
    return apiSuccess(restored);
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { BookService } from "@/lib/services/book.service";
import { requireAuthor } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuthor(req);

    const history = await BookService.getHistory(id, user.id);
    return apiSuccess(history);
  } catch (error) {
    return handleApiError(error);
  }
}

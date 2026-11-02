import { NextRequest } from "next/server";
import { BookService } from "@/lib/services/book.service";
import { requireAuthor, getAuthenticatedUser } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(req);
    const book = await BookService.getById(id, user?.id);

    return apiSuccess(book);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuthor(req);
    const body = await req.json();

    const updated = await BookService.updateBook(id, user.id, body);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuthor(req);

    const result = await BookService.deleteBook(id, user.id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

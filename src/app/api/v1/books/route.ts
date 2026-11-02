import { NextRequest } from "next/server";
import { BookService } from "@/lib/services/book.service";
import { requireAuthor, getAuthenticatedUser } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);

    const authorId = searchParams.get("authorId") || undefined;
    const visibility = searchParams.get("visibility") as "PRIVATE" | "PUBLIC" | "ALL" | null;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await BookService.listBooks({
      requestingUserId: user?.id,
      authorId,
      visibility: visibility || undefined,
      search,
      page,
      limit,
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthor(req);
    const body = await req.json();

    const book = await BookService.createBook(user.id, body);
    return apiSuccess(book, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { BookService } from "@/lib/services/book.service";
import { getAuthenticatedUser } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await getAuthenticatedUser(req);
    const book = await BookService.getBySlug(slug, user?.id);

    return apiSuccess(book);
  } catch (error) {
    return handleApiError(error);
  }
}

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

    const chapter = await BookService.addChapter(id, user.id, body);
    return apiSuccess(chapter, undefined, 201);
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
    const body = await req.json(); // expects { orders: [{ id, orderIndex }] }

    const updated = await BookService.reorderChapters(id, user.id, body.orders || []);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

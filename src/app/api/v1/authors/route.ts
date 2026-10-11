import { NextRequest } from "next/server";
import { UserService } from "@/lib/services/user.service";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : 20;

    const authors = await UserService.listPublicAuthors(limit);
    return apiSuccess(authors);
  } catch (error) {
    return handleApiError(error);
  }
}

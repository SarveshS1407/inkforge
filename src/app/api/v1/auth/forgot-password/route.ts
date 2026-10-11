import { NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await AuthService.requestPasswordReset(body.email);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

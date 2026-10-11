import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { AiService } from "@/lib/services/ai.service";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const status = AiService.getStatus();
    return apiSuccess(status);
  } catch (error) {
    return handleApiError(error);
  }
}

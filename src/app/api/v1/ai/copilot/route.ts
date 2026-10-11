import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { AiService } from "@/lib/services/ai.service";
import { AiCopilotRequestInput } from "@/types/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = (await req.json()) as AiCopilotRequestInput;

    const result = await AiService.executeTask(user.id, body);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

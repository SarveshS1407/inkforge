import { NextRequest, NextResponse } from "next/server";
import { realCoverService } from "@/lib/cover-generator/service";
import { BookVisualContext } from "@/types/cover-generator";
import { requireAuth } from "@/lib/auth/guard";
import { handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Enforce authentication: protect visual interpretation endpoint
    await requireAuth(req);

    const body = await req.json();
    const { context, userDirection } = body as {
      context?: BookVisualContext;
      userDirection?: string;
    };

    if (!context || !context.title || !context.description) {
      return NextResponse.json(
        { error: "Manuscript title and description are required for visual interpretation." },
        { status: 400 }
      );
    }

    if (!realCoverService.isConfigured()) {
      return NextResponse.json(
        {
          error:
            "AI cover generation isn't configured yet. Please configure OPENAI_API_KEY in your .env file.",
          unconfigured: true,
        },
        { status: 503 }
      );
    }

    const brief = await realCoverService.interpretBook(context, userDirection);
    return NextResponse.json({ brief });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { realCoverService } from "@/lib/cover-generator/service";
import { BookVisualContext } from "@/types/cover-generator";

export async function POST(req: NextRequest) {
  try {
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
    const errMessage = error instanceof Error ? error.message : "Visual interpretation failed.";
    console.error("API /api/covers/interpret error:", errMessage);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

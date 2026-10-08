import { NextRequest, NextResponse } from "next/server";
import { realCoverService } from "@/lib/cover-generator/service";
import { BookVisualContext, VisualBrief } from "@/types/cover-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { context, brief, conceptId, refinement } = body as {
      context?: BookVisualContext;
      brief?: VisualBrief;
      conceptId?: string;
      refinement?: string;
    };

    if (!context || !brief || !conceptId) {
      return NextResponse.json(
        { error: "Book context, visual brief, and conceptId are required for image generation." },
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

    const concept = brief.concepts.find((c) => c.id === conceptId) || brief.concepts[0];
    if (!concept) {
      return NextResponse.json(
        { error: `Concept with ID '${conceptId}' was not found in the visual brief.` },
        { status: 400 }
      );
    }

    const result = await realCoverService.generateConceptArtwork(context, brief, concept, {
      refinement,
    });

    return NextResponse.json({ result });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Image generation failed.";
    console.error("API /api/covers/generate error:", errMessage);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

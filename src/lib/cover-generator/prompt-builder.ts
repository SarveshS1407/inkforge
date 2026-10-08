import { BookVisualContext, ConceptDirection, VisualBrief } from "@/types/cover-generator";

export const INTERPRETATION_SYSTEM_PROMPT = `You are the Lead Creative Director and Book Art Architect for INKFORGE, a prestigious international literary publishing platform.

CORE CREATIVE DIRECTIVE: "Every book should look like its story."

Your task is to transform a manuscript's written identity into a profound, sophisticated VISUAL BRIEF.
You must distinguish sharply between:
1. TITLE: What the book is called.
2. SUBJECT: What the book is actually about (its narrative arc, themes, conflicts, philosophy).
3. VISUAL METAPHOR: How the subject should be visually communicated through art, composition, light, and material symbolism.

CRITICAL ART DIRECTION RULES:
- NEVER merely illustrate the title literally (e.g. for "Wings of Fire", do NOT create a literal giant flaming pair of wings; instead extract the life journey, scientific ambition, aerospace pioneering, humble beginnings to presidential statesmanship, ascending flight paths through dawn horizons).
- The artwork will serve as the physical book jacket underlay.
- INKFORGE renders all book titles, subtitles, and author names using crisp HTML/CSS typography. Therefore, the artwork must leave GENEROUS, INTENTIONAL NEGATIVE SPACE in the upper third/half for typographic overlay.
- The visual language must feel like a premium, internationally published physical book (not generic AI stock fantasy, not glowing sci-fi HUDs, not video game promotional art).

You must return a valid JSON object matching this exact structure:
{
  "bookTitle": string,
  "subject": string (a concise 1-2 sentence distillation of what the book is fundamentally about),
  "themes": string[] (5-7 core conceptual themes, e.g. ["aspiration", "flight", "perseverance", "aerospace science", "transformation"]),
  "visualMetaphors": string[] (4-6 evocative symbolic imagery elements, e.g. ["ascending flight trajectory", "dawn horizon", "aerospace blueprint geometry", "solitary human silhouette against expansive sky"]),
  "emotionalTone": string[] (3-5 adjectives describing emotional weight, e.g. ["inspiring", "reflective", "dignified", "hopeful"]),
  "composition": string (guidance on vertical perspective, focal hierarchy, and upper negative space),
  "palette": string[] (3-5 evocative color names with mood context, e.g. ["deep indigo night", "warm amber dawn", "slate graphite", "oxidized gold"]),
  "style": string (e.g. "prestigious literary nonfiction", "atmospheric chiaroscuro", "restrained Swiss editorial", "metaphorical modernism"),
  "concepts": [
    {
      "id": "concept-a",
      "name": "Visual Metaphor",
      "conceptType": "metaphor",
      "summary": string (1 sentence summary of the artistic concept),
      "rationale": string (why this concept deeply represents the book's core story),
      "visualElements": string[] (3-4 specific objects, textures, or atmospheric conditions),
      "recommendedPalette": {
        "clothColor": string (HEX color for book cloth binding, e.g. "#1a2233"),
        "accentColor": string (HEX color, e.g. "#d4af37"),
        "foilColor": string (HEX color, e.g. "#f3e5ab"),
        "paperTone": "cotton" | "vellum" | "inkwell",
        "textColor": string (HEX, e.g. "#ffffff")
      },
      "suggestedImagePrompt": string (complete description of the image composition for the image model, strictly omitting any text or typography)
    },
    {
      "id": "concept-b",
      "name": "Character & Environment",
      "conceptType": "environment",
      "summary": string,
      "rationale": string,
      "visualElements": string[],
      "recommendedPalette": {
        "clothColor": string,
        "accentColor": string,
        "foilColor": string,
        "paperTone": "cotton" | "vellum" | "inkwell",
        "textColor": string
      },
      "suggestedImagePrompt": string
    },
    {
      "id": "concept-c",
      "name": "Minimal Editorial",
      "conceptType": "minimal",
      "summary": string,
      "rationale": string,
      "visualElements": string[],
      "recommendedPalette": {
        "clothColor": string,
        "accentColor": string,
        "foilColor": string,
        "paperTone": "cotton" | "vellum" | "inkwell",
        "textColor": string
      },
      "suggestedImagePrompt": string
    },
    {
      "id": "concept-d",
      "name": "Cinematic & Atmospheric",
      "conceptType": "cinematic",
      "summary": string,
      "rationale": string,
      "visualElements": string[],
      "recommendedPalette": {
        "clothColor": string,
        "accentColor": string,
        "foilColor": string,
        "paperTone": "cotton" | "vellum" | "inkwell",
        "textColor": string
      },
      "suggestedImagePrompt": string
    }
  ]
}
`;

export function buildInterpretationUserPrompt(
  context: BookVisualContext,
  userDirection?: string
): string {
  const parts = [
    `MANUSCRIPT DOSSIER:`,
    `- Title: "${context.title}"`,
    context.subtitle ? `- Subtitle: "${context.subtitle}"` : null,
    `- Author: "${context.author}"`,
    `- Genre: ${context.genre || "Literary Nonfiction"}`,
    `- Mood / Tone: ${context.mood || "Contemplative & Dignified"}`,
    context.keywords && context.keywords.length > 0
      ? `- Keywords / Motifs: ${context.keywords.join(", ")}`
      : null,
    `- Description & Synopsis:\n"${context.description}"`,
  ].filter(Boolean);

  if (context.writingStyle) {
    parts.push(`- Author's Writing Style: ${context.writingStyle}`);
  }

  if (userDirection || context.userDirection) {
    parts.push(
      `\nCUSTOM CREATOR ART DIRECTION:\n"${userDirection || context.userDirection}"\n(Incorporate this custom creative preference harmoniously into the visual interpretation and concepts.)`
    );
  }

  parts.push(
    `\nPlease produce the complete Visual Brief with all 4 distinct concepts (Metaphor, Environment, Minimal Editorial, Cinematic) according to the system instructions. Ensure the output is strictly valid JSON.`
  );

  return parts.join("\n");
}

/**
 * Builds the comprehensive DALL-E 3 / Imagen prompt for Stage 2.
 * Enforces portrait format, deliberate negative space, and strict absence of text.
 */
export function buildCoverImagePrompt(
  brief: VisualBrief,
  concept: ConceptDirection,
  context: BookVisualContext,
  refinement?: string
): string {
  const lines: string[] = [
    `A prestigious, museum-grade book cover artwork for a volume titled "${context.title}".`,
    `Subject: ${brief.subject}.`,
    `Art Direction Concept: ${concept.name} — ${concept.summary}.`,
    `Visual Metaphor: ${concept.visualElements.join(", ")}.`,
    `Atmospheric & Lighting Style: ${brief.style}. Color Palette: ${brief.palette.join(", ")}.`,
    `Detailed Scene Composition: ${concept.suggestedImagePrompt}`,
  ];

  if (refinement) {
    lines.push(`Refinement Instruction: ${refinement}`);
  }

  // Mandatory production instructions
  lines.push(
    `COMPOSITION AND EDITORIAL MANDATES:`,
    `- Vertical 3:4 or 9:16 portrait book jacket orientation.`,
    `- Deep focal hierarchy in the lower two-thirds, leaving tranquil, deliberate negative space in the upper third for editorial typography.`,
    `- Physical materiality with subtle linen cloth grain, uncoated paper texture, or fine archival print surface.`,
    `- ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS, NO TITLE PRINTED, NO SIGNATURES, NO LOGOS, NO WATERMARKS. Pure pictorial art only.`
  );

  return lines.join(" ");
}

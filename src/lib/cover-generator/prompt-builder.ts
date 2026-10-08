import { CoverGenerationContext } from "./types";

export function buildCoverPrompt(context: CoverGenerationContext): string {
  const { title, genre, mood, keywords, direction, description } = context;

  const directionDirectives: Record<string, string> = {
    editorial:
      "Minimalist European literary art, clean Swiss composition, subtle linen texture, muted tones, large calm negative space in the upper portion, abstract focal motif, refined gallery aesthetic.",
    cinematic:
      "Atmospheric cinematic lighting, dramatic chiaroscuro, evocative depth of field, deep shadow play, emotional environmental storytelling, textured film grain, moody horizon.",
    experimental:
      "Contemporary avant-garde design, risograph and lithograph textures, deconstructed geometric forms, asymmetrical balance, bold visual tension, modern graphic art.",
    classic:
      "Timeless private press archival binding, rich bookcloth texture, blind-stamped ornamental filigree, balanced neoclassical framing, heritage printmaker style, dignified gravitas.",
  };

  const styleDirective = directionDirectives[direction] || directionDirectives.editorial;
  const keywordString = keywords.length > 0 ? keywords.join(", ") : genre;

  return [
    `High-end book cover background artwork for a work titled "${title}".`,
    `Genre: ${genre}. Mood: ${mood}.`,
    `Core themes and imagery: ${keywordString}. Context: ${description.slice(0, 180)}.`,
    `Art Direction: ${styleDirective}.`,
    `IMPORTANT COMPOSITION RULES:`,
    `- Vertical 3:4 portrait book cover format.`,
    `- Ample, quiet negative space preserved in upper half for typography overlay.`,
    `- Pure visual artwork ONLY: absolutely NO text, NO titles, NO letters, NO numbers, NO typography in the image.`,
    `- Archival print quality, physical materiality, subtle paper or cloth grain.`,
  ].join(" ");
}

export function extractVisualThemes(genre: string, mood: string, description: string): string[] {
  const themes = new Set<string>();

  const lowerDesc = description.toLowerCase();
  const lowerGenre = genre.toLowerCase();
  const lowerMood = mood.toLowerCase();

  if (lowerGenre.includes("tech") || lowerDesc.includes("software") || lowerDesc.includes("system")) {
    themes.add("Structural Logic");
    themes.add("Architectural Permanence");
    themes.add("Cybernetic Order");
  } else if (lowerGenre.includes("fiction") || lowerGenre.includes("novel") || lowerGenre.includes("literary")) {
    themes.add("Human Solitude");
    themes.add("Passage of Time");
    themes.add("Atmospheric Memory");
  } else if (lowerGenre.includes("horror") || lowerMood.includes("dark") || lowerMood.includes("unsettling")) {
    themes.add("Psychological Tension");
    themes.add("Liminal Shadows");
    themes.add("Nocturnal Gravity");
  } else if (lowerGenre.includes("poetry") || lowerMood.includes("ethereal")) {
    themes.add("Lyrical Negative Space");
    themes.add("Transient Flora");
    themes.add("Subtle Resonance");
  } else {
    themes.add("Sovereign Voice");
    themes.add("Enduring Materiality");
    themes.add("Still Horizon");
  }

  return Array.from(themes);
}

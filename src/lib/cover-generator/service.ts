import { getActiveProvider, getProviderStatus } from "./providers/registry";
import {
  BookVisualContext,
  ConceptDirection,
  GeneratedCoverResult,
  VisualBrief,
} from "@/types/cover-generator";
import { buildCoverImagePrompt } from "./prompt-builder";
import { persistCoverAsset } from "../storage/cover-storage";
import { CoverPalette, CoverTypography, CoverVersion } from "@/types/book";

export class RealCoverGenerationService {
  getStatus() {
    return getProviderStatus();
  }

  isConfigured(): boolean {
    return this.getStatus().configured;
  }

  /**
   * STAGE 1: Visual Interpretation
   * Analyzes manuscript metadata and generates a structured VisualBrief with 4 distinct concepts.
   */
  async interpretBook(context: BookVisualContext, userDirection?: string): Promise<VisualBrief> {
    const provider = getActiveProvider();
    if (!provider) {
      throw new Error(
        "AI cover generation isn't configured yet. Configure an image-generation provider (such as OPENAI_API_KEY in your .env) to enable this feature."
      );
    }

    return await provider.interpretBook(context, userDirection);
  }

  /**
   * STAGE 2: Image Generation
   * Generates artwork for a specific concept using the active image generation provider (e.g. DALL-E 3).
   * Persists the resulting image to asset storage and returns a ready-to-bind cover result.
   */
  async generateConceptArtwork(
    context: BookVisualContext,
    brief: VisualBrief,
    concept: ConceptDirection,
    options?: { refinement?: string }
  ): Promise<GeneratedCoverResult> {
    const provider = getActiveProvider();
    if (!provider) {
      throw new Error(
        "AI cover generation isn't configured yet. Please configure OPENAI_API_KEY to generate artwork."
      );
    }

    const prompt = buildCoverImagePrompt(brief, concept, context, options?.refinement);

    // Call Stage 2 provider
    const { imageUrl: rawImageUrl, model, revisedPrompt } = await provider.generateCoverImage(
      prompt,
      { size: "1024x1792", quality: "standard" }
    );

    // Download & persist asset so the URL never expires
    const uniqueId = `cov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const persistentImageUrl = await persistCoverAsset(rawImageUrl, uniqueId);

    const palette: CoverPalette = {
      clothColor: concept.recommendedPalette.clothColor || "#1b1917",
      accentColor: concept.recommendedPalette.accentColor || "#d4af37",
      foilColor: concept.recommendedPalette.foilColor || "#f5e6a8",
      paperTone: concept.recommendedPalette.paperTone || "cotton",
      textColor: concept.recommendedPalette.textColor || "#ffffff",
    };

    const typography: CoverTypography = {
      titleFont: "serif",
      style: "debossed-gold",
    };

    return {
      id: uniqueId,
      imageUrl: persistentImageUrl,
      prompt,
      revisedPrompt,
      concept,
      visualBrief: brief,
      palette,
      typography,
      provider: provider.name,
      model,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Converts a GeneratedCoverResult into an immutable CoverVersion for local storage & state.
   */
  toCoverVersion(result: GeneratedCoverResult, versionNumber: number): CoverVersion {
    // Map conceptType to valid CoverDirectionId
    let directionId: "editorial" | "cinematic" | "experimental" | "classic" = "editorial";
    if (result.concept.conceptType === "cinematic") directionId = "cinematic";
    else if (result.concept.conceptType === "experimental") directionId = "experimental";
    else if (result.concept.conceptType === "metaphor") directionId = "classic";

    return {
      id: result.id,
      versionNumber,
      directionId,
      imageUrl: result.imageUrl,
      generatedPrompt: result.prompt,
      palette: result.palette,
      typography: result.typography,
      artworkSource: "ai",
      createdAt: result.createdAt,
      notes: `${result.concept.name}: ${result.concept.summary}`,
      provider: result.provider,
      model: result.model,
      conceptName: result.concept.name,
    };
  }

  getActiveProviderName(): string {
    const status = this.getStatus();
    if (status.configured) {
      return status.activeProvider === "openai"
        ? "OpenAI (GPT-4o & DALL-E 3)"
        : "Google Gemini & Imagen 3";
    }
    return "Not Configured (Requires OPENAI_API_KEY)";
  }
}

export const realCoverService = new RealCoverGenerationService();
export const coverService = realCoverService;


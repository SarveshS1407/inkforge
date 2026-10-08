import { CoverProviderAdapter, CoverGenerationContext, CoverGenerationResult } from "./types";
import { CuratedEditorialProvider } from "./providers/curated-provider";
import { GeminiCoverProvider } from "./providers/gemini-provider";
import { CoverDirectionId, COVER_DIRECTIONS, CoverVersion } from "@/types/book";

class CoverGenerationService {
  private providers: CoverProviderAdapter[] = [];
  private curatedProvider: CuratedEditorialProvider;

  constructor() {
    this.curatedProvider = new CuratedEditorialProvider();
    const geminiProvider = new GeminiCoverProvider();

    this.providers = [geminiProvider, this.curatedProvider];
  }

  isAIConfigured(): boolean {
    return this.providers.some((p) => p.isAvailable() && p.name.includes("Gemini"));
  }

  getActiveProviderName(): string {
    const active = this.providers.find((p) => p.isAvailable());
    return active ? active.name : this.curatedProvider.name;
  }

  async generateCover(context: CoverGenerationContext): Promise<CoverGenerationResult> {
    // Attempt available AI provider first; gracefully fallback to Curated Editorial engine
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          return await provider.generate(context);
        } catch (err) {
          console.warn(`Provider ${provider.name} failed, falling back to next provider:`, err);
        }
      }
    }

    return await this.curatedProvider.generate(context);
  }

  async generateAllDirections(
    baseContext: Omit<CoverGenerationContext, "direction">
  ): Promise<Record<CoverDirectionId, CoverGenerationResult>> {
    const results: Partial<Record<CoverDirectionId, CoverGenerationResult>> = {};

    await Promise.all(
      COVER_DIRECTIONS.map(async (dir) => {
        const res = await this.generateCover({
          ...baseContext,
          direction: dir.id,
        });
        results[dir.id] = res;
      })
    );

    return results as Record<CoverDirectionId, CoverGenerationResult>;
  }

  createCoverVersion(result: CoverGenerationResult, versionNumber: number): CoverVersion {
    return {
      id: `cov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      versionNumber,
      directionId: result.direction,
      imageUrl: result.imageUrl,
      generatedPrompt: result.generatedPrompt,
      palette: result.palette,
      typography: result.typography,
      artworkSource: result.artworkSource,
      createdAt: new Date().toISOString(),
    };
  }
}

export const coverService = new CoverGenerationService();

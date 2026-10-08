import { BookVisualContext, VisualBrief } from "@/types/cover-generator";

export interface CoverGenerationProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  interpretBook(context: BookVisualContext, userDirection?: string): Promise<VisualBrief>;
  generateCoverImage(
    prompt: string,
    options?: { size?: "1024x1792" | "1024x1024"; quality?: "standard" | "hd" }
  ): Promise<{ imageUrl: string; model: string; revisedPrompt?: string }>;
}

import { CoverDirectionId, CoverPalette, CoverTypography } from "@/types/book";

export interface CoverGenerationContext {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  genre: string;
  mood: string;
  keywords: string[];
  direction: CoverDirectionId;
  preferredPalette?: Partial<CoverPalette>;
}

export interface CoverGenerationResult {
  imageUrl: string;
  generatedPrompt: string;
  palette: CoverPalette;
  typography: CoverTypography;
  direction: CoverDirectionId;
  providerName: string;
  artworkSource: "ai" | "template" | "upload" | "curated";
}

export interface CoverProviderAdapter {
  name: string;
  isAvailable(): boolean;
  generate(context: CoverGenerationContext): Promise<CoverGenerationResult>;
}

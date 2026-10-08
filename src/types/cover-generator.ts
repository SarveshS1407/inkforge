import { CoverPalette, CoverTypography, CoverDirectionId, PaperTone } from "./book";

export interface BookVisualContext {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  genre: string;
  mood: string;
  keywords: string[];
  writingStyle?: string;
  intendedAudience?: string;
  userDirection?: string;
}

export interface ConceptDirection {
  id: string;
  name: string;
  conceptType: "metaphor" | "environment" | "minimal" | "cinematic" | "experimental";
  summary: string;
  rationale: string;
  visualElements: string[];
  recommendedPalette: {
    clothColor: string;
    accentColor: string;
    foilColor: string;
    paperTone: PaperTone;
    textColor: string;
  };
  suggestedImagePrompt: string;
}

export interface VisualBrief {
  bookTitle: string;
  subject: string;
  themes: string[];
  visualMetaphors: string[];
  emotionalTone: string[];
  composition: string;
  palette: string[];
  style: string;
  concepts: ConceptDirection[];
}

export interface ProviderStatus {
  configured: boolean;
  activeProvider?: "openai" | "gemini" | "none";
  model?: string;
  missingKeys?: string[];
  message: string;
}

export interface GenerateCoverRequest {
  context: BookVisualContext;
  conceptId?: string;
  customDirection?: string;
  refinement?: string;
  aspectRatio?: "portrait_3_4" | "portrait_9_16";
}

export interface GeneratedCoverResult {
  id: string;
  imageUrl: string;
  prompt: string;
  revisedPrompt?: string;
  concept: ConceptDirection;
  visualBrief: VisualBrief;
  palette: CoverPalette;
  typography: CoverTypography;
  provider: string;
  model: string;
  createdAt: string;
}

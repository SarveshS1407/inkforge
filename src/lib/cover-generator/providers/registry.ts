import { CoverGenerationProvider } from "./provider.interface";
import { OpenAICoverProvider } from "./openai-provider";
import { GeminiCoverProvider } from "./gemini-provider";
import { ProviderStatus } from "@/types/cover-generator";

const openAIProvider = new OpenAICoverProvider();
const geminiProvider = new GeminiCoverProvider();

export function getAvailableProviders(): CoverGenerationProvider[] {
  return [openAIProvider, geminiProvider];
}

export function getActiveProvider(): CoverGenerationProvider | null {
  if (openAIProvider.isConfigured()) {
    return openAIProvider;
  }
  if (geminiProvider.isConfigured()) {
    return geminiProvider;
  }
  return null;
}

export function getProviderStatus(): ProviderStatus {
  if (openAIProvider.isConfigured()) {
    return {
      configured: true,
      activeProvider: "openai",
      model: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
      message: "OpenAI Image Engine (DALL-E 3 & GPT-4o) is configured and active.",
    };
  }

  if (geminiProvider.isConfigured()) {
    return {
      configured: true,
      activeProvider: "gemini",
      model: "imagen-3.0-generate-002",
      message: "Google Gemini & Imagen 3 Engine is configured and active.",
    };
  }

  return {
    configured: false,
    activeProvider: "none",
    missingKeys: ["OPENAI_API_KEY"],
    message:
      "AI cover generation isn't configured yet. Add OPENAI_API_KEY to your .env file to enable real AI publishing covers.",
  };
}

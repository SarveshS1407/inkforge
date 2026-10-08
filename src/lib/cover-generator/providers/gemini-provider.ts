import { CoverGenerationProvider } from "./provider.interface";
import { BookVisualContext, VisualBrief } from "@/types/cover-generator";
import {
  INTERPRETATION_SYSTEM_PROMPT,
  buildInterpretationUserPrompt,
} from "../prompt-builder";

export class GeminiCoverProvider implements CoverGenerationProvider {
  readonly id = "gemini";
  readonly name = "Google Gemini & Imagen";

  private get apiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  isConfigured(): boolean {
    const key = this.apiKey;
    return typeof key === "string" && key.trim().length > 0 && !key.includes("your-key");
  }

  async interpretBook(context: BookVisualContext, userDirection?: string): Promise<VisualBrief> {
    if (!this.isConfigured()) {
      throw new Error(
        "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment (.env file)."
      );
    }

    const userPrompt = buildInterpretationUserPrompt(context, userDirection);
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: INTERPRETATION_SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Gemini Book Interpretation failed: ${err?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned an empty candidate for visual interpretation.");
    }

    try {
      return JSON.parse(text) as VisualBrief;
    } catch {
      throw new Error("Failed to parse visual brief JSON from Gemini.");
    }
  }

  async generateCoverImage(
    prompt: string,
    options?: { size?: "1024x1792" | "1024x1024"; quality?: "standard" | "hd" }
  ): Promise<{ imageUrl: string; model: string; revisedPrompt?: string }> {
    if (!this.isConfigured()) {
      throw new Error(
        "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment (.env file)."
      );
    }

    const model = "imagen-3.0-generate-002";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: options?.size === "1024x1024" ? "1:1" : "3:4",
          outputMimeType: "image/png",
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Imagen Generation failed: ${err?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) {
      throw new Error("Imagen did not return image data.");
    }

    return {
      imageUrl: `data:image/png;base64,${b64}`,
      model,
      revisedPrompt: prompt,
    };
  }
}

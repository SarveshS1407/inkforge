import { CoverGenerationProvider } from "./provider.interface";
import { BookVisualContext, VisualBrief } from "@/types/cover-generator";
import {
  INTERPRETATION_SYSTEM_PROMPT,
  buildInterpretationUserPrompt,
} from "../prompt-builder";

export class OpenAICoverProvider implements CoverGenerationProvider {
  readonly id = "openai";
  readonly name = "OpenAI (GPT-4o & DALL-E 3)";

  private get apiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  isConfigured(): boolean {
    const key = this.apiKey;
    return typeof key === "string" && key.trim().length > 0 && !key.includes("your-key");
  }

  async interpretBook(context: BookVisualContext, userDirection?: string): Promise<VisualBrief> {
    if (!this.isConfigured()) {
      throw new Error(
        "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment (.env file)."
      );
    }

    const userPrompt = buildInterpretationUserPrompt(context, userDirection);
    const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: INTERPRETATION_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error?.message || response.statusText;
      throw new Error(`OpenAI Book Interpretation failed (${response.status}): ${message}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty response for visual interpretation.");
    }

    try {
      const parsed = JSON.parse(content) as VisualBrief;
      return parsed;
    } catch {
      throw new Error("Failed to parse JSON visual brief from OpenAI response.");
    }
  }

  async generateCoverImage(
    prompt: string,
    options?: { size?: "1024x1792" | "1024x1024"; quality?: "standard" | "hd" }
  ): Promise<{ imageUrl: string; model: string; revisedPrompt?: string }> {
    if (!this.isConfigured()) {
      throw new Error(
        "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment (.env file)."
      );
    }

    const model = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
    const size = options?.size || "1024x1792"; // Portrait format for book covers
    const quality = options?.quality || "standard";

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size,
        quality,
        response_format: "url",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error?.message || response.statusText;
      throw new Error(`OpenAI Image Generation failed (${response.status}): ${message}`);
    }

    const data = await response.json();
    const imageRecord = data.data?.[0];
    if (!imageRecord?.url) {
      throw new Error("OpenAI did not return an image URL.");
    }

    return {
      imageUrl: imageRecord.url,
      model,
      revisedPrompt: imageRecord.revised_prompt,
    };
  }
}

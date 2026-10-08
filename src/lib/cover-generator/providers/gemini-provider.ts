import { CoverProviderAdapter, CoverGenerationContext, CoverGenerationResult } from "../types";
import { buildCoverPrompt } from "../prompt-builder";

export class GeminiCoverProvider implements CoverProviderAdapter {
  name = "Google Gemini Imagen API";

  isAvailable(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async generate(context: CoverGenerationContext): Promise<CoverGenerationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("AI cover generation isn't configured yet. Missing GEMINI_API_KEY.");
    }

    const prompt = buildCoverPrompt(context);

    try {
      // Direct call to Gemini Image Generation API
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "3:4",
            outputOptions: { mimeType: "image/jpeg" },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const data = await response.json();
      const b64Image = data?.predictions?.[0]?.bytesBase64Encoded;
      if (!b64Image) {
        throw new Error("No image data returned from provider");
      }

      const imageUrl = `data:image/jpeg;base64,${b64Image}`;

      return {
        imageUrl,
        generatedPrompt: prompt,
        palette: {
          clothColor: "#1a1c20",
          accentColor: "#d8a14b",
          foilColor: "#fae6a6",
          paperTone: "cotton",
          textColor: "#ffffff",
        },
        typography: {
          titleFont: context.direction === "classic" ? "serif" : "sans",
          style: "debossed-gold",
        },
        direction: context.direction,
        providerName: this.name,
        artworkSource: "ai",
      };
    } catch (err) {
      console.warn("Gemini cover generation failed:", err);
      throw err;
    }
  }
}

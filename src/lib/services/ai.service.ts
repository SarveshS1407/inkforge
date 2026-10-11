/**
 * INKFORGE — AI WRITING COPILOT SERVICE & PROVIDER ADAPTER
 * Server-side AI integration supporting Gemini, OpenAI, and Local Editorial Mock engine.
 *
 * Enforces:
 * - Session identity and document ownership checks
 * - Strict context and input length bounds
 * - Zero client-side API key exposure
 * - Abuse rate-limiting per author
 * - Error normalization and failure resilience
 */

import { prisma } from "../db";
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
} from "../errors";
import {
  AiTaskType,
  AiCopilotRequestInput,
  AiCopilotResult,
  AiProviderStatus,
} from "@/types/ai";

// ============================================================================
// SYSTEM PROMPTS & EDITORIAL GUIDELINES
// ============================================================================
const SYSTEM_PROMPT = `You are the INKFORGE Editorial Copilot, a master literary editor and architectural writing assistant for long-form authors.
Your duty is to help the author refine, polish, and elevate their prose while rigorously preserving their authentic voice and artistic intent.

Editorial Principles:
1. Never overwrite or flatten the author's voice into generic, bland corporate language.
2. For text rewrites, grammar corrections, tone shifts, and expansions, return ONLY the replacement prose without conversational preamble or meta-commentary.
3. For continue writing, pick up the cadence and style seamlessly from the cursor context.
4. For manuscript reviews, consistency critiques, and Q&A, provide structured, thoughtful observations grounded strictly in the supplied text.
5. Never invent or hallucinate factual claims as established historical or scientific truths.
6. Respect the author's sovereignty: your output is purely an advisory suggestion that the author may review, edit, or reject.`;

// ============================================================================
// RATE LIMITER (In-Memory Sliding Window)
// ============================================================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute per author
const requestLogs = new Map<string, number[]>();

function checkRateLimit(userId: string) {
  const now = Date.now();
  const timestamps = requestLogs.get(userId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new TooManyRequestsError(
      "AI request rate limit reached. Please pause a moment before generating further suggestions."
    );
  }

  validTimestamps.push(now);
  requestLogs.set(userId, validTimestamps);
}

// ============================================================================
// PROVIDER ADAPTER INTERFACE
// ============================================================================
interface AiProvider {
  readonly id: "gemini" | "openai" | "mock";
  readonly modelName: string;
  isConfigured(): boolean;
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
}

// ----------------------------------------------------------------------------
// 1. Google Gemini Provider
// ----------------------------------------------------------------------------
class GeminiProvider implements AiProvider {
  readonly id = "gemini" as const;
  get modelName() {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  private get apiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  isConfigured(): boolean {
    const key = this.apiKey;
    return (
      typeof key === "string" &&
      key.trim().length > 0 &&
      !key.includes("your-key") &&
      !key.includes("placeholder")
    );
  }

  async generateText(prompt: string, systemInstruction = SYSTEM_PROMPT): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const msg = errorJson?.error?.message || response.statusText;
      throw new Error(`Google Gemini API error (${response.status}): ${msg}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned an empty response candidate.");
    }
    return text.trim();
  }
}

// ----------------------------------------------------------------------------
// 2. OpenAI Provider
// ----------------------------------------------------------------------------
class OpenAiProvider implements AiProvider {
  readonly id = "openai" as const;
  get modelName() {
    return process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  private get apiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  isConfigured(): boolean {
    const key = this.apiKey;
    return (
      typeof key === "string" &&
      key.trim().length > 0 &&
      !key.includes("your-key") &&
      !key.includes("placeholder")
    );
  }

  async generateText(prompt: string, systemInstruction = SYSTEM_PROMPT): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const msg = errorJson?.error?.message || response.statusText;
      throw new Error(`OpenAI API error (${response.status}): ${msg}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("OpenAI returned an empty completion choice.");
    }
    return text.trim();
  }
}

// ----------------------------------------------------------------------------
// 3. High-Fidelity Local Editorial Mock Provider
// ----------------------------------------------------------------------------
class MockEditorialProvider implements AiProvider {
  readonly id = "mock" as const;
  readonly modelName = "inkforge-editorial-local-v1";

  isConfigured(): boolean {
    return true; // Always available as zero-cost offline engine
  }

  async generateText(prompt: string): Promise<string> {
    // Deterministic simulation based on prompt keywords
    return generateEditorialSimulation(prompt);
  }
}

function generateEditorialSimulation(prompt: string): string {
  // Extract task and target text from prompt
  if (prompt.includes("TASK: REWRITE")) {
    const match = prompt.match(/TEXT TO PROCESS:\n([\s\S]+?)(?:\n\n|\nINSTRUCTIONS:|$)/);
    const source = match ? match[1].trim() : "The prose moves forward with clarity.";
    return `${source} Rephrased with enhanced cadence, deliberate syntax, and resonant editorial rhythm.`;
  }

  if (prompt.includes("TASK: GRAMMAR")) {
    const match = prompt.match(/TEXT TO PROCESS:\n([\s\S]+?)(?:\n\n|\nINSTRUCTIONS:|$)/);
    const source = match ? match[1].trim() : "";
    // Clean common grammatical issues and polish punctuation
    let polished = source
      .replace(/\s+/g, " ")
      .replace(/ ,/g, ",")
      .replace(/ \./g, ".")
      .trim();
    if (!polished.endsWith(".") && !polished.endsWith("!") && !polished.endsWith("?")) {
      polished += ".";
    }
    return polished;
  }

  if (prompt.includes("TASK: TONE")) {
    const toneMatch = prompt.match(/TARGET TONE:\s*([^\n]+)/);
    const tone = toneMatch ? toneMatch[1].trim().toLowerCase() : "conversational";
    const textMatch = prompt.match(/TEXT TO PROCESS:\n([\s\S]+?)(?:\n\n|\nINSTRUCTIONS:|$)/);
    const source = textMatch ? textMatch[1].trim() : "The ideas remain central.";

    if (tone.includes("formal") || tone.includes("academic")) {
      return `Upon rigorous consideration, ${source.charAt(0).toLowerCase() + source.slice(1)} Such formulations establish an enduring structural foundation.`;
    }
    if (tone.includes("conversational") || tone.includes("casual")) {
      return `To put it plainly: ${source.charAt(0).toLowerCase() + source.slice(1)} It simply resonates in a more direct, human way.`;
    }
    if (tone.includes("persuasive")) {
      return `The imperative is unmistakable: ${source.charAt(0).toLowerCase() + source.slice(1)} This is where decisive commitment transforms the craft.`;
    }
    if (tone.includes("descriptive") || tone.includes("lyrical")) {
      return `Beneath the quiet hum of the page, ${source.charAt(0).toLowerCase() + source.slice(1)} The words cast long shadows across the silence.`;
    }
    return `Refined in the ${tone} register: ${source}`;
  }

  if (prompt.includes("TASK: SHORTEN")) {
    const match = prompt.match(/TEXT TO PROCESS:\n([\s\S]+?)(?:\n\n|\nINSTRUCTIONS:|$)/);
    const source = match ? match[1].trim() : "";
    const sentences = source.split(/(?<=[.?!])\s+/);
    if (sentences.length > 1) {
      return sentences.slice(0, Math.ceil(sentences.length / 2)).join(" ");
    }
    return source.replace(/in order to/g, "to").replace(/due to the fact that/g, "because");
  }

  if (prompt.includes("TASK: EXPAND")) {
    const match = prompt.match(/TEXT TO PROCESS:\n([\s\S]+?)(?:\n\n|\nINSTRUCTIONS:|$)/);
    const source = match ? match[1].trim() : "";
    return `${source}\n\nTo develop this thesis further, one must examine the underlying tensions between transient digital mediums and the permanence of literature. Each sentence functions not merely as an informational carrier, but as an architectural pillar that upholds the reader's contemplation.`;
  }

  if (prompt.includes("TASK: CONTINUE")) {
    return `Furthermore, this continuity invites the author to look deeper into the horizon of their argument. The next sequence of thought must address the consequence of these observations, guiding the reader from observation toward lasting realization.`;
  }

  if (prompt.includes("TASK: TITLES")) {
    return `1. The Architecture of the Solitary Ledger\n2. Words in Stone: Crafting Permanent Prose\n3. The Sovereign Scribe's Compendium\n4. Beyond the Ephemeral Stream\n5. On the Endurance of Written Thought\n\nSuggested Subtitle: "Essays on Digital Permanence, Literary Integrity, and Archival Craft"`;
  }

  if (prompt.includes("TASK: OUTLINE")) {
    return `## Structural Outline Proposal\n\nI. Prologue: The Crisis of Ephemeral Publishing\n   - The decay of digital memory\n   - Reclaiming the slower cadence of literature\n\nII. Core Argument: Architecture as Literature\n   - Structural permanence vs. transient feeds\n   - The author's sovereign workspace\n\nIII. Synthesis: Crafting Enduring Systems\n   - Local-first resilience\n   - Archival delivery\n\nIV. Epilogue: The Inscribed Word Endures`;
  }

  if (prompt.includes("TASK: QA")) {
    return `Based on the provided manuscript passages:\n\n• Central Thesis: The piece explores the intersection of architectural discipline and digital writing, advocating for durable, long-horizon software and literature.\n• Key Sections Covered: The initial critique of disposable web feeds and the transition toward sovereign author tools.\n• Clarification Suggestion: The shift between technical storage metaphors and philosophical essays could benefit from a transitional bridge in the second section.`;
  }

  if (prompt.includes("TASK: CONSISTENCY")) {
    return `Editorial Consistency Audit:\n\n1. Voice & Cadence: The prose maintains a dignified, contemplative tone throughout.\n2. Terminology Observation: Check the alternating use of "manuscript" and "document"—standardizing on "manuscript" reinforces the platform's editorial identity.\n3. Pacing: Section transition between the introductory sketch and main thesis is slightly abrupt; consider expanding the second paragraph.`;
  }

  // Default custom fallback
  return `The editorial suggestion has been composed in accordance with your instructions, preserving the rhythm and integrity of the original text.`;
}

// ============================================================================
// AI SERVICE CLASS
// ============================================================================
export class AiService {
  private static gemini = new GeminiProvider();
  private static openai = new OpenAiProvider();
  private static mock = new MockEditorialProvider();

  /**
   * Returns the active AI provider based on environment configuration.
   */
  static getActiveProvider(): AiProvider {
    // In test environment or when explicitly requested, use mock
    if (
      process.env.NODE_ENV === "test" ||
      process.env.INKFORGE_AI_PROVIDER === "mock"
    ) {
      return this.mock;
    }

    // Prefer Gemini if key is provided
    if (this.gemini.isConfigured()) {
      return this.gemini;
    }

    // Next check OpenAI
    if (this.openai.isConfigured()) {
      return this.openai;
    }

    // Graceful fallback to local mock engine
    return this.mock;
  }

  /**
   * Retrieves provider status and capabilities.
   */
  static getStatus(): AiProviderStatus {
    const provider = this.getActiveProvider();
    const isLive = provider.id !== "mock";

    return {
      configured: isLive,
      activeProvider: provider.id,
      model: provider.modelName,
      features: [
        "rewrite",
        "grammar",
        "tone",
        "shorten",
        "expand",
        "continue",
        "titles",
        "outline",
        "qa",
        "consistency",
        "custom",
      ],
    };
  }

  /**
   * Executes a requested AI writing task.
   */
  static async executeTask(
    requesterId: string,
    input: AiCopilotRequestInput
  ): Promise<AiCopilotResult> {
    // 1. Enforce rate limiting
    checkRateLimit(requesterId);

    // 2. Validate task type
    const validTasks: AiTaskType[] = [
      "rewrite",
      "grammar",
      "tone",
      "shorten",
      "expand",
      "continue",
      "titles",
      "outline",
      "qa",
      "consistency",
      "custom",
    ];

    if (!input.task || !validTasks.includes(input.task)) {
      throw new ValidationError(
        `Invalid AI task '${input.task}'. Supported tasks are: ${validTasks.join(", ")}`
      );
    }

    // 3. Validate context lengths
    const selectedText = input.selectedText?.trim() || "";
    const manuscriptContext = input.manuscriptContext?.trim() || "";
    const instructions = input.instructions?.trim() || "";

    if (selectedText.length > 12000) {
      throw new ValidationError(
        "Selected text exceeds maximum length of 12,000 characters (approx. 2,500 words)."
      );
    }

    if (manuscriptContext.length > 20000) {
      throw new ValidationError(
        "Manuscript context exceeds maximum length of 20,000 characters."
      );
    }

    if (instructions.length > 1000) {
      throw new ValidationError(
        "Custom instructions exceed maximum length of 1,000 characters."
      );
    }

    // 4. Verify Document Ownership if documentId provided
    if (input.documentId) {
      const doc = await prisma.post.findUnique({
        where: { id: input.documentId },
        select: { id: true, authorId: true },
      });

      if (!doc) {
        throw new NotFoundError(`Document with ID '${input.documentId}' not found.`);
      }

      if (doc.authorId !== requesterId) {
        throw new ForbiddenError(
          "Access denied: You may only invoke AI assistance on your own manuscripts."
        );
      }
    }

    // 5. Require text for selection-dependent operations
    const requiresSelection: AiTaskType[] = ["rewrite", "grammar", "tone", "shorten", "expand"];
    if (requiresSelection.includes(input.task) && !selectedText && !manuscriptContext) {
      throw new ValidationError(
        `Task '${input.task}' requires a text selection or manuscript context to operate on.`
      );
    }

    // 6. Construct prompt
    const prompt = this.buildPrompt(input);

    // 7. Execute generation via active provider
    const provider = this.getActiveProvider();
    let suggestion = "";

    try {
      suggestion = await provider.generateText(prompt);
    } catch (err: any) {
      // Normalize provider errors
      const sanitizedMsg = err.message?.replace(/key=[^&\s]+/gi, "key=REDACTED") || "Provider failure";
      throw new Error(`AI generation failed: ${sanitizedMsg}`);
    }

    return {
      suggestion,
      task: input.task,
      originalText: selectedText || undefined,
      model: provider.modelName,
      provider: provider.id,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Helper to format task prompts according to editorial constraints.
   */
  private static buildPrompt(input: AiCopilotRequestInput): string {
    const { task, selectedText, manuscriptContext, instructions, tone, documentTitle } = input;

    let taskInstruction = "";
    switch (task) {
      case "rewrite":
        taskInstruction = "TASK: REWRITE\nRewrite the selected text to enhance clarity, narrative rhythm, and engagement while preserving the core meaning.";
        break;
      case "grammar":
        taskInstruction = "TASK: GRAMMAR\nCorrect all grammatical errors, typos, punctuation issues, and awkward syntax. Make minimal changes needed for correctness.";
        break;
      case "tone":
        taskInstruction = `TASK: TONE\nTARGET TONE: ${tone || "conversational"}\nAdjust the tone of the selected passage to match the requested style without losing the author's primary thesis.`;
        break;
      case "shorten":
        taskInstruction = "TASK: SHORTEN\nCondense and tighten the selected passage. Remove redundant phrases, repetition, and filler while preserving all essential substance.";
        break;
      case "expand":
        taskInstruction = "TASK: EXPAND\nElaborate on the selected passage with nuanced considerations, evocative sensory detail, and intellectual depth. Do NOT fabricate false empirical facts.";
        break;
      case "continue":
        taskInstruction = "TASK: CONTINUE\nContinue writing from where the manuscript or selected text leaves off. Maintain the established voice, tone, and argumentative momentum.";
        break;
      case "titles":
        taskInstruction = "TASK: TITLES\nSuggest 5 evocative, literary title alternatives and an accompanying subtitle for this manuscript based on its central themes.";
        break;
      case "outline":
        taskInstruction = "TASK: OUTLINE\nSuggest a clear, well-structured structural outline for this manuscript with Roman numeral sections and thematic focus points.";
        break;
      case "qa":
        taskInstruction = `TASK: QA\nAnalyze the manuscript and answer the following author question thoughtfully:\nQuestion: "${instructions || "What are the core arguments and potential blind spots in this piece?"}"`;
        break;
      case "consistency":
        taskInstruction = "TASK: CONSISTENCY\nConduct an editorial consistency review. Identify any contradictory claims, repeated phrases, awkward transitions, or tone discrepancies.";
        break;
      case "custom":
      default:
        taskInstruction = `TASK: CUSTOM\nExecute the author's specific writing instruction:\n"${instructions || "Polish and improve this text."}"`;
        break;
    }

    const titleHeader = documentTitle ? `MANUSCRIPT TITLE: "${documentTitle}"\n` : "";
    const selectedBlock = selectedText ? `\nTEXT TO PROCESS:\n${selectedText}\n` : "";
    const contextBlock = manuscriptContext ? `\nMANUSCRIPT CONTEXT:\n${manuscriptContext}\n` : "";
    const customBlock = instructions && task !== "custom" && task !== "qa" ? `\nADDITIONAL INSTRUCTIONS:\n${instructions}\n` : "";

    return `${taskInstruction}\n\n${titleHeader}${selectedBlock}${contextBlock}${customBlock}`.trim();
  }
}

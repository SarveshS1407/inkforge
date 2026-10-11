/**
 * INKFORGE — AI WRITING COPILOT TYPES
 * Typed specifications for AI Mode, task requests, suggestion review, and provider contracts.
 */

export type AiTaskType =
  | "rewrite"
  | "grammar"
  | "tone"
  | "shorten"
  | "expand"
  | "continue"
  | "titles"
  | "outline"
  | "qa"
  | "consistency"
  | "custom";

export type AiToneOption =
  | "formal"
  | "conversational"
  | "professional"
  | "persuasive"
  | "descriptive"
  | "restrained"
  | "lyrical"
  | "custom";

export interface AiCopilotRequestInput {
  task: AiTaskType;
  selectedText?: string;
  manuscriptContext?: string;
  instructions?: string;
  tone?: string;
  documentId?: string;
  documentTitle?: string;
}

export interface AiCopilotResult {
  suggestion: string;
  task: AiTaskType;
  originalText?: string;
  model: string;
  provider: "gemini" | "openai" | "mock";
  createdAt: string;
}

export interface AiProviderStatus {
  configured: boolean;
  activeProvider: "gemini" | "openai" | "mock";
  model: string;
  features: string[];
}

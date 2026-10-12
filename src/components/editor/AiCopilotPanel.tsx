"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  X,
  Wand2,
  Check,
  Copy,
  RotateCcw,
  AlertCircle,
  Loader2,
  FileText,
  HelpCircle,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Edit3,
  Sliders,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { AiTaskType, AiCopilotResult, AiProviderStatus } from "@/types/ai";

interface AiCopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  editor: any;
  documentId?: string | null;
  documentTitle?: string;
}

const TASKS = [
  {
    id: "rewrite" as AiTaskType,
    label: "Rewrite Selection",
    desc: "Rephrase for enhanced clarity, rhythm, and flow",
    requiresSelection: true,
    group: "selection",
  },
  {
    id: "grammar" as AiTaskType,
    label: "Grammar & Clarity",
    desc: "Polish syntax, fix typos, and eliminate awkward phrasing",
    requiresSelection: true,
    group: "selection",
  },
  {
    id: "tone" as AiTaskType,
    label: "Adjust Tone",
    desc: "Shift voice to formal, conversational, persuasive, or lyrical",
    requiresSelection: true,
    group: "selection",
  },
  {
    id: "shorten" as AiTaskType,
    label: "Make Concise",
    desc: "Condense prose, eliminate filler, and distill core substance",
    requiresSelection: true,
    group: "selection",
  },
  {
    id: "expand" as AiTaskType,
    label: "Expand & Elaborate",
    desc: "Enrich with nuanced considerations and sensory depth",
    requiresSelection: true,
    group: "selection",
  },
  {
    id: "continue" as AiTaskType,
    label: "Continue Writing",
    desc: "Pick up narrative cadence and advance the manuscript",
    requiresSelection: false,
    group: "generative",
  },
  {
    id: "titles" as AiTaskType,
    label: "Suggest Titles & Subtitle",
    desc: "Generate 5 literary title alternatives and subtitle concepts",
    requiresSelection: false,
    group: "generative",
  },
  {
    id: "outline" as AiTaskType,
    label: "Structure & Outline",
    desc: "Draft a thematic Roman-numeral structural outline",
    requiresSelection: false,
    group: "generative",
  },
  {
    id: "qa" as AiTaskType,
    label: "Manuscript Q&A",
    desc: "Ask analytical questions about themes and arguments",
    requiresSelection: false,
    group: "review",
  },
  {
    id: "consistency" as AiTaskType,
    label: "Consistency Audit",
    desc: "Review voice, repeated concepts, and transitional shifts",
    requiresSelection: false,
    group: "review",
  },
  {
    id: "custom" as AiTaskType,
    label: "Custom Instruction",
    desc: "Describe your bespoke writing request to the Copilot",
    requiresSelection: false,
    group: "custom",
  },
];

const TONES = [
  "Formal & Academic",
  "Conversational & Warm",
  "Professional & Authoritative",
  "Persuasive & Urgent",
  "Descriptive & Lyrical",
  "Restrained & Meditative",
];

export function AiCopilotPanel({
  isOpen,
  onClose,
  editor,
  documentId,
  documentTitle,
}: AiCopilotPanelProps) {
  const [selectedTask, setSelectedTask] = useState<AiTaskType>("rewrite");
  const [customInstructions, setCustomInstructions] = useState("");
  const [selectedTone, setSelectedTone] = useState(TONES[0]);
  const [activeTab, setActiveTab] = useState<"selection" | "generative" | "review" | "custom">("selection");

  // Selection Snapshot & Target
  const [capturedSelection, setCapturedSelection] = useState<{
    text: string;
    from: number;
    to: number;
  } | null>(null);

  // Execution State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AiCopilotResult | null>(null);
  const [editableSuggestion, setEditableSuggestion] = useState("");
  const [isApplied, setIsApplied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Provider Status
  const [providerStatus, setProviderStatus] = useState<AiProviderStatus | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch provider status once on mount
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch("/api/v1/ai/status");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setProviderStatus(json.data);
          }
        }
      } catch {
        // Fallback default
      }
    }
    loadStatus();
  }, []);

  // Update selection snapshot whenever editor selection changes or panel opens
  const updateSelectionSnapshot = useCallback(() => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (!empty) {
      const text = editor.state.doc.textBetween(from, to, " ");
      if (text.trim()) {
        setCapturedSelection({ text: text.trim(), from, to });
        return;
      }
    }
    setCapturedSelection(null);
  }, [editor]);

  useEffect(() => {
    if (isOpen) {
      updateSelectionSnapshot();
      setIsApplied(false);
    }
  }, [isOpen, updateSelectionSnapshot]);

  // Adjust active tab if selection changes
  useEffect(() => {
    if (capturedSelection) {
      setActiveTab("selection");
      setSelectedTask("rewrite");
    } else {
      setActiveTab((prev) => {
        if (prev === "selection") {
          setSelectedTask("continue");
          return "generative";
        }
        return prev;
      });
    }
  }, [capturedSelection]);

  // Handle task submission
  const handleGenerate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setIsApplied(false);
    setCopied(false);

    abortControllerRef.current = new AbortController();

    const fullManuscript = editor ? editor.getText() : "";
    const targetText = capturedSelection?.text || "";

    const payload = {
      task: selectedTask,
      selectedText: targetText || undefined,
      manuscriptContext: fullManuscript ? fullManuscript.substring(0, 15000) : undefined,
      instructions: customInstructions.trim() || undefined,
      tone: selectedTask === "tone" ? selectedTone : undefined,
      documentId: documentId || undefined,
      documentTitle: documentTitle || undefined,
    };

    try {
      const res = await fetch("/api/v1/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to generate AI suggestion.");
      }

      setResult(json.data);
      setEditableSuggestion(json.data.suggestion);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setErrorMessage("Request cancelled by author.");
      } else {
        setErrorMessage(err.message || "An unexpected error occurred during generation.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  // Explicitly apply the suggestion to the editor
  const handleApply = () => {
    if (!editor || !result || isApplied) return;

    const textToInsert = editableSuggestion.trim();
    if (!textToInsert) return;

    // Check if we are replacing a specific selection
    if (capturedSelection && capturedSelection.text) {
      const { from, to } = capturedSelection;
      const currentDoc = editor.state.doc;

      // Verify bounds
      if (to <= currentDoc.content.size) {
        editor
          .chain()
          .focus()
          .insertContentAt({ from, to }, textToInsert)
          .run();
      } else {
        // Fallback: replace current selection
        editor.chain().focus().insertContent(textToInsert).run();
      }
    } else {
      // Generative continuation or insertion at cursor
      editor.chain().focus().insertContent(textToInsert).run();
    }

    setIsApplied(true);
  };

  const handleCopy = () => {
    if (!editableSuggestion) return;
    navigator.clipboard.writeText(editableSuggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReject = () => {
    setResult(null);
    setEditableSuggestion("");
    setIsApplied(false);
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="AI Writing Copilot"
      className="flex flex-col h-full border-l border-[var(--editorial-rule)] bg-[var(--paper-warm)] shadow-xl animate-in fade-in slide-in-from-right duration-200 z-40 select-text"
    >
      {/* -------------------------------------------------------------------
          COPILOT HEADER
          ------------------------------------------------------------------- */}
      <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] px-4 py-3 bg-[var(--paper-surface)]">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-[var(--oxblood-subtle)] text-[var(--oxblood)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)]">
              AI Writing Copilot
            </h3>
            <div className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
              <span>{providerStatus?.model || "Editorial Engine"}</span>
              <span>•</span>
              <span className="text-[var(--oxblood)] font-semibold">Advisory Mode</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[var(--ink-muted)] hover:text-[var(--oxblood)] hover:bg-[var(--paper-warm)] transition-colors cursor-pointer"
          title="Close Copilot Panel (Esc)"
          aria-label="Close AI Copilot"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* -------------------------------------------------------------------
          COPILOT SCROLLABLE CONTENT BODY
          ------------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Active Selection Indicator */}
        {capturedSelection ? (
          <div className="rounded-lg border border-[var(--oxblood)]/30 bg-[var(--oxblood-subtle)]/40 p-3 text-xs font-editorial-sans">
            <div className="flex items-center justify-between text-[10px] font-editorial-mono uppercase tracking-wider text-[var(--oxblood)] font-bold mb-1">
              <span>Active Target Selection</span>
              <span>{capturedSelection.text.split(/\s+/).length} words</span>
            </div>
            <p className="line-clamp-2 italic text-[var(--ink-secondary)] text-[11px] leading-relaxed">
              &ldquo;{capturedSelection.text}&rdquo;
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-3 text-xs font-editorial-sans text-[var(--ink-secondary)] flex items-center justify-between">
            <span>No text selected. Targeting whole manuscript context.</span>
            <button
              type="button"
              onClick={updateSelectionSnapshot}
              className="text-[10px] font-editorial-mono uppercase text-[var(--oxblood)] hover:underline font-bold"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Task Category Tabs */}
        <div className="flex rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-1 text-xs font-editorial-mono">
          <button
            type="button"
            onClick={() => setActiveTab("selection")}
            className={`flex-1 py-1 rounded text-center text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "selection"
                ? "bg-[var(--oxblood)] text-white font-bold"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Refine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("generative")}
            className={`flex-1 py-1 rounded text-center text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "generative"
                ? "bg-[var(--oxblood)] text-white font-bold"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Generate
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className={`flex-1 py-1 rounded text-center text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "review"
                ? "bg-[var(--oxblood)] text-white font-bold"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Review
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`flex-1 py-1 rounded text-center text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "custom"
                ? "bg-[var(--oxblood)] text-white font-bold"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Task Selection Grid */}
        <div className="space-y-1.5">
          {TASKS.filter((t) => t.group === activeTab).map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => setSelectedTask(task.id)}
              className={`w-full text-left rounded-lg p-2.5 transition-all border cursor-pointer ${
                selectedTask === task.id
                  ? "border-[var(--oxblood)] bg-[var(--paper-surface)] shadow-xs"
                  : "border-transparent bg-[var(--paper-surface)]/60 hover:bg-[var(--paper-surface)] hover:border-[var(--paper-border)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-xs font-bold text-[var(--ink-primary)]">
                  {task.label}
                </span>
                {selectedTask === task.id && (
                  <Check className="h-3 w-3 text-[var(--oxblood)]" />
                )}
              </div>
              <p className="mt-0.5 text-[10px] font-editorial-sans text-[var(--ink-muted)] leading-normal">
                {task.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Tone Options (if tone task selected) */}
        {selectedTask === "tone" && (
          <div className="space-y-1.5 pt-2">
            <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
              Target Literary Tone
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTone(t)}
                  className={`rounded-md p-2 text-left text-[11px] font-editorial-sans transition-all border cursor-pointer ${
                    selectedTone === t
                      ? "border-[var(--oxblood)] bg-[var(--oxblood-subtle)] text-[var(--oxblood)] font-semibold"
                      : "border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Instructions / Q&A Input */}
        {(selectedTask === "custom" || selectedTask === "qa" || selectedTask === "rewrite") && (
          <div className="space-y-1.5 pt-1">
            <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
              {selectedTask === "qa"
                ? "Your Question About the Manuscript"
                : "Specific Editorial Instructions (Optional)"}
            </label>
            <textarea
              rows={2}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={
                selectedTask === "qa"
                  ? "e.g., Is my central thesis supported well in the middle paragraphs?"
                  : "e.g., Make the sentence structure more poetic and concise..."
              }
              className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] p-2 text-xs font-editorial-sans text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:border-[var(--oxblood)] focus:outline-hidden resize-none"
            />
          </div>
        )}

        {/* Generate Action Button */}
        <div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-[var(--oxblood)] px-4 py-2 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Crafting Suggestion...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5" />
                <span>Generate Suggestion</span>
              </>
            )}
          </button>
          {isLoading && (
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={handleCancel}
                className="text-[10px] font-editorial-mono uppercase text-[var(--ink-muted)] hover:text-[var(--oxblood)] underline"
              >
                Cancel Generation
              </button>
            </div>
          )}
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="rounded-lg border border-[var(--oxblood)] bg-[var(--oxblood-subtle)] p-3 text-xs text-[var(--oxblood)] flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold">Generation Paused</div>
              <p className="mt-0.5 text-[11px] leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            SUGGESTION REVIEW & COMPARISON INTERFACE
            ----------------------------------------------------------------- */}
        {result && (
          <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 space-y-3 shadow-md animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-2 font-editorial-mono text-[10px]">
              <span className="uppercase tracking-wider font-bold text-[var(--oxblood)] flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                <span>Review Suggestion</span>
              </span>
              {capturedSelection && (
                <button
                  type="button"
                  onClick={() => setShowDiff(!showDiff)}
                  className="text-[10px] text-[var(--ink-muted)] hover:text-[var(--oxblood)] underline uppercase cursor-pointer"
                >
                  {showDiff ? "Hide Original" : "Show Original"}
                </button>
              )}
            </div>

            {/* Original Comparison View if enabled */}
            {showDiff && capturedSelection && (
              <div className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] p-2.5 text-xs">
                <span className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] block mb-1">
                  Original Manuscript Text
                </span>
                <p className="font-editorial-serif text-[11px] text-[var(--ink-secondary)] italic leading-relaxed line-through opacity-70">
                  {capturedSelection.text}
                </p>
              </div>
            )}

            {/* Editable Suggestion Textarea */}
            <div>
              <span className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] block mb-1">
                Suggested Replacement (Editable)
              </span>
              <textarea
                rows={6}
                value={editableSuggestion}
                onChange={(e) => {
                  setEditableSuggestion(e.target.value);
                  setIsApplied(false);
                }}
                className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-2.5 font-editorial-serif text-xs leading-relaxed text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden"
              />
            </div>

            {/* Review Action Controls */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplied}
                className={`flex-1 inline-flex items-center justify-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-editorial-sans font-semibold uppercase tracking-wider shadow-xs transition-all cursor-pointer ${
                  isApplied
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-[var(--oxblood)] text-white hover:bg-[var(--oxblood-hover)]"
                }`}
                title="Apply suggestion to the manuscript"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isApplied ? "Applied to Manuscript!" : "Apply Suggestion"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] p-1.5 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors cursor-pointer"
                title="Copy to clipboard"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] p-1.5 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors cursor-pointer"
                title="Regenerate suggestion"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleReject}
                className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] px-2.5 py-1.5 text-xs font-editorial-mono text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors cursor-pointer"
                title="Dismiss and discard this suggestion"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            PRIVACY DISCLOSURE
            ----------------------------------------------------------------- */}
        <div className="pt-2 border-t border-[var(--editorial-rule)] text-[10px] font-editorial-mono text-[var(--ink-muted)] space-y-1">
          <div className="flex items-center space-x-1.5 text-[var(--ink-secondary)]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-semibold uppercase tracking-wider">Editorial Privacy Pledge</span>
          </div>
          <p className="leading-relaxed">
            Only your active selection or relevant manuscript excerpt is sent to the configured AI provider. No personal credentials or unrelated manuscripts are transmitted.
          </p>
        </div>
      </div>
    </aside>
  );
}

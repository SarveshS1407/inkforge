"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Feather, FileText, Upload, ArrowRight, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { ChapterReviewModal } from "./ChapterReviewModal";
import { ParseResult } from "@/lib/services/import.service";

interface BookCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookCreated?: (book: any) => void;
}

type TabMode = "DIRECT" | "PASTE" | "UPLOAD";

export function BookCreateModal({ isOpen, onClose, onBookCreated }: BookCreateModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabMode>("DIRECT");
  const [directTitle, setDirectTitle] = useState("");
  const [directSubtitle, setDirectSubtitle] = useState("");
  const [directCoverTheme, setDirectCoverTheme] = useState("obsidian");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review modal state
  const [reviewResult, setReviewResult] = useState<ParseResult | null>(null);
  const [isCreatingFinal, setIsCreatingFinal] = useState(false);

  if (!isOpen) return null;

  // 1. Direct Book Creation
  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directTitle.trim() || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: directTitle.trim(),
          subtitle: directSubtitle.trim() || undefined,
          coverTheme: directCoverTheme,
          visibility: "PRIVATE",
          importMethod: "DIRECT",
          chapters: [
            {
              title: "Chapter 1",
              contentHtml: "<p></p>",
              orderIndex: 1,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create book.");
      }

      onClose();
      if (onBookCreated) onBookCreated(data.data);
      // Navigate to writing studio
      router.push(`/write?bookId=${data.data.id}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Creation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Paste Text Analysis
  const handlePasteAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim() || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pasteText,
          title: pasteTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to analyze pasted text.");
      }

      setReviewResult(data.data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Text analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. File Upload Analysis (.docx / .pdf)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/books/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to parse manuscript file.");
      }

      setReviewResult(data.data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Upload processing failed.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 4. Final Book Inscription from Chapter Review
  const handleConfirmFinal = async (finalData: {
    title: string;
    description?: string;
    visibility: "PRIVATE" | "PUBLIC";
    coverTheme: string;
    chapters: Array<{ title: string; contentHtml: string; orderIndex: number }>;
  }) => {
    if (!reviewResult) return;
    setIsCreatingFinal(true);

    try {
      const res = await fetch("/api/v1/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...finalData,
          importMethod: reviewResult.importMethod,
          sourceFilename: reviewResult.sourceFilename,
          importWarnings: reviewResult.warnings,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to inscribe book.");
      }

      setReviewResult(null);
      onClose();
      if (onBookCreated) onBookCreated(data.data);
      router.push(`/posts`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to finalize book.");
    } finally {
      setIsCreatingFinal(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
      >
        <div className="relative w-full max-w-xl max-h-[90dvh] flex flex-col rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] px-6 py-4 bg-[var(--paper-warm)]/70">
            <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] font-bold">
              <Feather className="h-4 w-4" />
              <span>Inscribe New Book Volume</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-border)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Creation Mode Tabs */}
          <div className="flex border-b border-[var(--editorial-rule)] bg-[var(--paper-canvas)] px-6 text-xs font-editorial-mono">
            <button
              type="button"
              onClick={() => {
                setActiveTab("DIRECT");
                setErrorMessage(null);
              }}
              className={`py-3 px-3 border-b-2 font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === "DIRECT"
                  ? "border-[var(--oxblood)] text-[var(--oxblood)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <Feather className="h-3.5 w-3.5" />
              <span>Direct Studio</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("PASTE");
                setErrorMessage(null);
              }}
              className={`py-3 px-3 border-b-2 font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === "PASTE"
                  ? "border-[var(--oxblood)] text-[var(--oxblood)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Paste Manuscript</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("UPLOAD");
                setErrorMessage(null);
              }}
              className={`py-3 px-3 border-b-2 font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === "UPLOAD"
                  ? "border-[var(--oxblood)] text-[var(--oxblood)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Word / PDF</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {errorMessage && (
              <div className="rounded-lg bg-[var(--paper-warm)] border border-[var(--oxblood)]/40 p-3 flex items-start space-x-2 text-xs text-[var(--oxblood)] font-editorial-sans">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: DIRECT */}
            {activeTab === "DIRECT" && (
              <form onSubmit={handleDirectSubmit} className="space-y-4">
                <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)]">
                  Start writing a new book from scratch in Scribe Studio. An initial Chapter 1 will be primed for your quill.
                </p>

                <div>
                  <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold mb-1">
                    Book Title
                  </label>
                  <input
                    type="text"
                    required
                    value={directTitle}
                    onChange={(e) => setDirectTitle(e.target.value)}
                    placeholder="e.g. The Architecture of Permanence"
                    disabled={isProcessing}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 font-editorial-serif text-base text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-bold mb-1">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    value={directSubtitle}
                    onChange={(e) => setDirectSubtitle(e.target.value)}
                    placeholder="e.g. Essays on Craft and Enduring Systems"
                    disabled={isProcessing}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-1.5 font-editorial-sans text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold mb-1">
                    Cover Binding Palette
                  </label>
                  <select
                    value={directCoverTheme}
                    onChange={(e) => setDirectCoverTheme(e.target.value)}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 font-editorial-mono text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden cursor-pointer"
                  >
                    <option value="obsidian">Obsidian Black (Classic Leather)</option>
                    <option value="vellum">Vellum Ivory (Warm Papercraft)</option>
                    <option value="crimson">Crimson Cloth (Guild Edition)</option>
                    <option value="emerald">Emerald Morocco (Rare Archive)</option>
                    <option value="linen">Linen Natural (Editorial Press)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing || !directTitle.trim()}
                    className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Open in Scribe Studio</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: PASTE */}
            {activeTab === "PASTE" && (
              <form onSubmit={handlePasteAnalyze} className="space-y-4">
                <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)]">
                  Paste entire manuscripts or multiple chapters. INKFORGE will automatically detect chapter boundaries (e.g. &quot;Chapter 1&quot;, &quot;Prologue&quot;, headings) and present an interactive calibration review.
                </p>

                <div>
                  <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-bold mb-1">
                    Book Title (Optional — auto-detected if left blank)
                  </label>
                  <input
                    type="text"
                    value={pasteTitle}
                    onChange={(e) => setPasteTitle(e.target.value)}
                    placeholder="e.g. Chronicles of the North"
                    disabled={isProcessing}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-1.5 font-editorial-sans text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold mb-1">
                    Manuscript Text
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste your chapters here...

Chapter 1: The Gathering
It was an afternoon of deep stillness...

Chapter 2: The Binding
The pages were pressed into leather..."
                    disabled={isProcessing}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-3 font-editorial-serif text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden resize-y"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing || !pasteText.trim()}
                    className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Analyze &amp; Detect Chapters</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: UPLOAD */}
            {activeTab === "UPLOAD" && (
              <div className="space-y-4">
                <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)]">
                  Upload an existing manuscript document. INKFORGE extracts typography, detects chapter splits, and prepares folios for permanent archival binding.
                </p>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--paper-border)] hover:border-[var(--oxblood)] rounded-xl p-8 text-center cursor-pointer transition-colors bg-[var(--paper-canvas)] flex flex-col items-center justify-center space-y-3 group"
                >
                  <div className="h-12 w-12 rounded-full bg-[var(--paper-warm)] border border-[var(--paper-border)] flex items-center justify-center text-[var(--oxblood)] group-hover:scale-105 transition-transform">
                    {isProcessing ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </div>

                  <div>
                    <p className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)]">
                      {isProcessing ? "Parsing manuscript..." : "Select Microsoft Word (.docx) or PDF (.pdf)"}
                    </p>
                    <p className="mt-1 font-editorial-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">
                      Up to 50 MB • Automatic chapter segmentation
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Import Chapter Calibration Modal */}
      {reviewResult && (
        <ChapterReviewModal
          isOpen={true}
          onClose={() => setReviewResult(null)}
          parseResult={reviewResult}
          onConfirm={handleConfirmFinal}
          isCreating={isCreatingFinal}
        />
      )}
    </>
  );
}

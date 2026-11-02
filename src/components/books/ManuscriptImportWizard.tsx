"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Upload,
  FileText,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Layers,
  BookOpen,
  Edit2,
  Trash2,
  Plus,
  MoveUp,
  MoveDown,
  Eye,
  AlignLeft,
  AlignJustify,
  Type,
  Lock,
  Globe,
  Split,
  Merge,
  CheckCircle2,
  Sliders,
  Palette,
  Maximize2,
} from "lucide-react";
import {
  DetectedChapter,
  ParseResult,
  BookFormattingOptions,
  DEFAULT_BOOK_FORMATTING,
  ChapterUtils,
  toRoman,
} from "@/types/import";
import { SafeContentRenderer } from "@/components/content/SafeContentRenderer";

interface ManuscriptImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onBookCreated?: (book: any) => void;
  initialTab?: "UPLOAD" | "PASTE";
}

type WizardStep = 1 | 2 | 3 | 4;

const THEMES = [
  { id: "obsidian", label: "Obsidian", bg: "bg-[#181615]", border: "border-[#3a3532]", text: "text-[#ede7de]" },
  { id: "vellum", label: "Vellum", bg: "bg-[#f5eedc]", border: "border-[#d8ccb0]", text: "text-[#2b2622]" },
  { id: "parchment", label: "Parchment", bg: "bg-[#ece4d0]", border: "border-[#cfc3a5]", text: "text-[#231e1a]" },
  { id: "burgundy", label: "Burgundy", bg: "bg-[#4a181d]", border: "border-[#6b252c]", text: "text-[#f7e6e8]" },
  { id: "forest", label: "Forest", bg: "bg-[#16291e]", border: "border-[#2b4c37]", text: "text-[#e2f0e6]" },
  { id: "sapphire", label: "Sapphire", bg: "bg-[#152336]", border: "border-[#253f60]", text: "text-[#e2eaf5]" },
  { id: "midnight", label: "Midnight", bg: "bg-[#0d0f14]", border: "border-[#232938]", text: "text-[#e2e7f3]" },
];

export function ManuscriptImportWizard({
  isOpen,
  onClose,
  onBookCreated,
  initialTab = "UPLOAD",
}: ManuscriptImportWizardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [step, setStep] = useState<WizardStep>(1);
  const [activeSource, setActiveSource] = useState<"DOCX" | "PDF" | "PASTE">(
    initialTab === "PASTE" ? "PASTE" : "DOCX"
  );

  // Step 1: Upload / Source state
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [pasteText, setPasteText] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 2: Extracted Data & Review State
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [bookSubtitle, setBookSubtitle] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [chapters, setChapters] = useState<DetectedChapter[]>([]);
  const [editingChapterIdx, setEditingChapterIdx] = useState<number | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState("");
  const [previewChapterIdx, setPreviewChapterIdx] = useState<number | null>(null);
  const [splitModalIdx, setSplitModalIdx] = useState<number | null>(null);
  const [splitKeyword, setSplitKeyword] = useState("");

  // Step 3: Formatting & Customization State
  const [formatting, setFormatting] = useState<BookFormattingOptions>(DEFAULT_BOOK_FORMATTING);
  const [coverTheme, setCoverTheme] = useState("obsidian");
  const [coverEmblem, setCoverEmblem] = useState("feather");
  const [previewLeaf, setPreviewLeaf] = useState<"TITLE" | "CHAPTER">("TITLE");
  const [previewLeafChapterIdx, setPreviewLeafChapterIdx] = useState(0);

  // Step 4: Submission State
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // File drag handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processSelectedFile(file);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    const fname = file.name.toLowerCase();
    const isDocx = fname.endsWith(".docx");
    const isPdf = fname.endsWith(".pdf");

    if (!isDocx && !isPdf) {
      setErrorMessage("Please upload a Microsoft Word (.docx) or PDF (.pdf) file.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage(
        `Manuscript file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed 25MB limit.`
      );
      return;
    }

    try {
      setUploadProgress(15);
      setProgressStatus("Reading manuscript binary...");

      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(45);
      setProgressStatus("Parsing typography, headings, and document structure...");

      const res = await fetch("/api/v1/books/import", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);
      setProgressStatus("Extracting inline leaves and sanitizing manuscript...");

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to parse manuscript.");
      }

      setUploadProgress(100);
      setProgressStatus("Import complete!");

      const data: ParseResult = json.data;
      setParseResult(data);
      setBookTitle(data.detectedTitle || file.name.replace(/\.[^/.]+$/, ""));
      setBookSubtitle(data.detectedSubtitle || "");
      setChapters(data.chapters);
      setStep(2);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Manuscript upload failed.");
    } finally {
      setUploadProgress(null);
      setProgressStatus("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) {
      setErrorMessage("Please paste your manuscript text before continuing.");
      return;
    }

    setErrorMessage(null);
    try {
      setUploadProgress(30);
      setProgressStatus("Analyzing pasted text structure...");

      const res = await fetch("/api/v1/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pasteText,
          title: pasteTitle.trim() || undefined,
        }),
      });

      setUploadProgress(80);
      setProgressStatus("Segmenting chapters...");

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to analyze text.");
      }

      setUploadProgress(100);
      const data: ParseResult = json.data;
      setParseResult(data);
      setBookTitle(data.detectedTitle || "Pasted Manuscript");
      setBookSubtitle(data.detectedSubtitle || "");
      setChapters(data.chapters);
      setStep(2);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Text analysis failed.");
    } finally {
      setUploadProgress(null);
      setProgressStatus("");
    }
  };

  // Chapter Manipulation Handlers
  const handleRenameChapter = (index: number) => {
    if (!editChapterTitle.trim()) return;
    const next = ChapterUtils.renameChapter(chapters, index, editChapterTitle);
    setChapters(next);
    setEditingChapterIdx(null);
    setEditChapterTitle("");
  };

  const handleMoveChapter = (fromIdx: number, toIdx: number) => {
    const next = ChapterUtils.reorderChapters(chapters, fromIdx, toIdx);
    setChapters(next);
  };

  const handleMergeWithPrevious = (index: number) => {
    if (index <= 0) return;
    const next = ChapterUtils.mergeChapters(chapters, index - 1, index);
    setChapters(next);
  };

  const handleSplitChapter = (chapterIdx: number) => {
    if (!splitKeyword.trim()) return;
    const next = ChapterUtils.splitChapter(chapters, chapterIdx, splitKeyword.trim());
    setChapters(next);
    setSplitModalIdx(null);
    setSplitKeyword("");
  };

  const handleDeleteChapter = (index: number) => {
    if (chapters.length <= 1) return;
    const next = ChapterUtils.deleteChapter(chapters, index);
    setChapters(next);
  };

  const handleAddBlankChapter = () => {
    const next = ChapterUtils.addChapter(chapters);
    setChapters(next);
  };

  // Final Book Creation
  const handleFinalSubmit = async () => {
    if (!bookTitle.trim()) {
      setErrorMessage("Volume title is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bookTitle.trim(),
          subtitle: bookSubtitle.trim() || undefined,
          description: bookDescription.trim() || undefined,
          coverTheme,
          coverEmblem,
          visibility, // Strictly defaults to "PRIVATE"
          formattingOptions: JSON.stringify(formatting),
          importMethod: parseResult?.importMethod || "DOCX",
          sourceFilename: parseResult?.sourceFilename,
          originalFileSize: parseResult?.fileSize,
          stagedFileKey: parseResult?.stagedFileKey,
          importWarnings: parseResult?.warnings,
          chapters: chapters.map((ch, idx) => ({
            title: ch.title,
            contentHtml: ch.contentHtml,
            orderIndex: idx + 1,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to inscribe book.");
      }

      onClose();
      if (onBookCreated) onBookCreated(json.data);
      router.push(`/books/${json.data.id}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create book.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-2xl overflow-hidden">
        {/* Header with Step Tracker */}
        <div className="flex items-center justify-between border-b border-[var(--paper-border)] px-6 py-4 bg-[var(--paper-warm)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[var(--oxblood-subtle)] text-[var(--oxblood)]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <div className="font-editorial-mono text-[10px] font-bold uppercase tracking-widest text-[var(--oxblood)]">
                Manuscript Import Studio
              </div>
              <h2 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                {step === 1 && "Select Manuscript Source"}
                {step === 2 && "Automated Chapter Detection & Review"}
                {step === 3 && "Professional Book Formatting & Live Preview"}
                {step === 4 && "Archival Confirmation & Privacy Enforcement"}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Step Indicators */}
            <div className="hidden sm:flex items-center space-x-2 font-editorial-mono text-xs">
              {[
                { s: 1, label: "Source" },
                { s: 2, label: "Chapters" },
                { s: 3, label: "Styling" },
                { s: 4, label: "Inscribe" },
              ].map((item) => (
                <div
                  key={item.s}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold ${
                    step === item.s
                      ? "bg-[var(--oxblood)] text-white shadow-xs"
                      : step > item.s
                      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
                      : "text-[var(--ink-muted)] bg-[var(--paper-surface)]"
                  }`}
                >
                  <span>{item.s}</span>
                  <span className="hidden md:inline">· {item.label}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-[var(--ink-muted)] hover:bg-[var(--paper-canvas)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-950/60 border-b border-red-200 dark:border-red-900/40 p-3 px-6 flex items-center space-x-2 text-xs text-red-800 dark:text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ========================================================================= */}
          {/* STEP 1: MANUSCRIPT SOURCE SELECTION & UPLOAD                              */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Method Tabs */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSource("DOCX")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    activeSource === "DOCX"
                      ? "border-[var(--oxblood)] bg-[var(--oxblood-subtle)] text-[var(--oxblood)] shadow-xs ring-1 ring-[var(--oxblood)]"
                      : "border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-secondary)] hover:border-[var(--ink-muted)]"
                  }`}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="font-editorial-serif font-bold text-sm">Word Document</span>
                  <span className="font-editorial-mono text-[10px] text-[var(--ink-muted)] mt-0.5">
                    .docx format
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSource("PDF")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    activeSource === "PDF"
                      ? "border-[var(--oxblood)] bg-[var(--oxblood-subtle)] text-[var(--oxblood)] shadow-xs ring-1 ring-[var(--oxblood)]"
                      : "border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-secondary)] hover:border-[var(--ink-muted)]"
                  }`}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="font-editorial-serif font-bold text-sm">PDF Document</span>
                  <span className="font-editorial-mono text-[10px] text-[var(--ink-muted)] mt-0.5">
                    .pdf format
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSource("PASTE")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    activeSource === "PASTE"
                      ? "border-[var(--oxblood)] bg-[var(--oxblood-subtle)] text-[var(--oxblood)] shadow-xs ring-1 ring-[var(--oxblood)]"
                      : "border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-secondary)] hover:border-[var(--ink-muted)]"
                  }`}
                >
                  <AlignLeft className="h-6 w-6 mb-2" />
                  <span className="font-editorial-serif font-bold text-sm">Paste Content</span>
                  <span className="font-editorial-mono text-[10px] text-[var(--ink-muted)] mt-0.5">
                    Plain or Markdown
                  </span>
                </button>
              </div>

              {/* Upload Drag & Drop Area (for DOCX & PDF) */}
              {activeSource !== "PASTE" && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl transition-all ${
                    dragActive
                      ? "border-[var(--oxblood)] bg-[var(--oxblood-subtle)]"
                      : "border-[var(--paper-border)] bg-[var(--paper-canvas)] hover:border-[var(--oxblood)]/60"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={activeSource === "DOCX" ? ".docx" : ".pdf"}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="p-4 rounded-full bg-[var(--paper-warm)] text-[var(--oxblood)] mb-4 shadow-2xs">
                    <Upload className="h-8 w-8" />
                  </div>

                  <h3 className="font-editorial-serif text-base font-bold text-[var(--ink-primary)]">
                    Drag and drop your {activeSource === "DOCX" ? "Word (.docx)" : "PDF (.pdf)"} manuscript here
                  </h3>
                  <p className="font-editorial-sans text-xs text-[var(--ink-secondary)] mt-1 text-center max-w-sm">
                    Preserves document title, headings (H1/H2), bold/italic prose, bulleted lists, and inline images.
                  </p>

                  <div className="mt-5 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Browse Manuscript File</span>
                    </button>
                  </div>

                  <div className="mt-4 flex items-center space-x-3 text-[11px] font-editorial-mono text-[var(--ink-muted)]">
                    <span>Accepted: {activeSource === "DOCX" ? ".docx" : ".pdf"}</span>
                    <span>•</span>
                    <span>Max Size: 25 MB</span>
                    <span>•</span>
                    <span>Strictly Private Archival</span>
                  </div>

                  {/* Upload Progress Indicator */}
                  {uploadProgress !== null && (
                    <div className="w-full max-w-md mt-6 space-y-2">
                      <div className="flex justify-between text-xs font-editorial-mono text-[var(--oxblood)] font-bold">
                        <span>{progressStatus}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-[var(--paper-border)] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[var(--oxblood)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paste Text Area */}
              {activeSource === "PASTE" && (
                <form onSubmit={handlePasteSubmit} className="space-y-4">
                  <div>
                    <label className="block font-editorial-mono text-[11px] uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                      Manuscript Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={pasteTitle}
                      onChange={(e) => setPasteTitle(e.target.value)}
                      placeholder="e.g. The Quiet Hours"
                      className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 text-sm text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-editorial-mono text-[11px] uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                      Manuscript Prose Content
                    </label>
                    <textarea
                      rows={12}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="Paste your full manuscript here. Headings such as 'Chapter 1', 'Prologue', 'Part I', or markdown '# Chapter' will automatically be segmented into distinct chapters."
                      className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-3 text-sm font-editorial-serif text-[var(--ink-primary)] leading-relaxed focus:border-[var(--oxblood)] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={uploadProgress !== null || !pasteText.trim()}
                      className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-5 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {uploadProgress !== null ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      <span>Analyze &amp; Segment Chapters</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: AUTOMATED CHAPTER DETECTION & REVIEW SCREEN                       */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Manuscript Identity Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-4">
                <div>
                  <label className="block font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--oxblood)] mb-1">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-1.5 text-sm font-editorial-serif font-bold text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    value={bookSubtitle}
                    onChange={(e) => setBookSubtitle(e.target.value)}
                    placeholder="e.g. A Tale of Seven Seas"
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-1.5 text-sm font-editorial-serif text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Warnings Banner if any */}
              {parseResult?.warnings && parseResult.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-300/80 bg-amber-50 dark:bg-amber-950/40 p-3 space-y-1 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center space-x-1.5 font-editorial-mono font-bold text-[10px] uppercase">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Parser Observations ({parseResult.warnings.length})</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                    {parseResult.warnings.slice(0, 3).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Stats Bar */}
              <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-2">
                <div className="flex items-center space-x-4 text-xs font-editorial-mono text-[var(--ink-secondary)]">
                  <span>
                    Chapters: <strong className="text-[var(--ink-primary)]">{chapters.length}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Words: <strong className="text-[var(--ink-primary)]">{totalWords.toLocaleString()}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Method: <strong className="text-[var(--oxblood)]">{parseResult?.importMethod || "DOCX"}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddBlankChapter}
                  className="inline-flex items-center space-x-1 rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1 text-[11px] font-editorial-mono text-[var(--ink-primary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Chapter</span>
                </button>
              </div>

              {/* Chapters List */}
              <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                {chapters.map((ch, idx) => (
                  <div
                    key={ch.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-3 hover:border-[var(--oxblood)]/50 transition-all shadow-2xs"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="shrink-0 rounded bg-[var(--oxblood-subtle)] px-2 py-1 font-editorial-mono text-[10px] font-bold text-[var(--oxblood)]">
                        Part {idx + 1}
                      </span>

                      {editingChapterIdx === idx ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="text"
                            value={editChapterTitle}
                            onChange={(e) => setEditChapterTitle(e.target.value)}
                            className="flex-1 rounded border border-[var(--oxblood)] bg-[var(--paper-canvas)] px-2 py-1 text-xs font-editorial-serif text-[var(--ink-primary)] focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameChapter(idx)}
                            className="p-1 rounded bg-[var(--oxblood)] text-white hover:bg-[var(--oxblood-hover)] cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingChapterIdx(null)}
                            className="p-1 rounded border border-[var(--paper-border)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)] truncate">
                              {ch.title}
                            </h4>
                            <span className="font-editorial-mono text-[10px] text-[var(--ink-muted)] shrink-0">
                              · {ch.wordCount.toLocaleString()} words
                            </span>
                          </div>
                          <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)] truncate mt-0.5">
                            {ch.excerpt}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--paper-border)]">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChapterIdx(idx);
                          setEditChapterTitle(ch.title);
                        }}
                        className="p-1.5 rounded hover:bg-[var(--paper-canvas)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
                        title="Rename chapter"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewChapterIdx(idx)}
                        className="p-1.5 rounded hover:bg-[var(--paper-canvas)] text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors cursor-pointer"
                        title="Preview formatted chapter leaves"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveChapter(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded hover:bg-[var(--paper-canvas)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveChapter(idx, idx + 1)}
                        disabled={idx === chapters.length - 1}
                        className="p-1.5 rounded hover:bg-[var(--paper-canvas)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </button>

                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMergeWithPrevious(idx)}
                          className="p-1.5 rounded hover:bg-[var(--paper-canvas)] text-[var(--ink-muted)] hover:text-[var(--oxblood)] cursor-pointer"
                          title="Merge with previous chapter"
                        >
                          <Merge className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSplitModalIdx(idx)}
                        className="p-1.5 rounded hover:bg-[var(--paper-canvas)] text-[var(--ink-muted)] hover:text-[var(--oxblood)] cursor-pointer"
                        title="Split chapter at phrase or marker"
                      >
                        <Split className="h-3.5 w-3.5" />
                      </button>

                      {chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteChapter(idx)}
                          className="p-1.5 rounded hover:bg-[var(--paper-canvas)] text-red-600 hover:text-red-700 cursor-pointer"
                          title="Remove chapter"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: PROFESSIONAL BOOK FORMATTING & LIVE PREVIEW                       */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Formatting Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-4 max-h-[56vh] overflow-y-auto pr-1">
                {/* Typography: Body Font */}
                <div className="space-y-1.5">
                  <label className="block font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--oxblood)]">
                    Body Typography
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "serif", label: "Editorial Serif" },
                      { id: "garamond", label: "Garamond Book" },
                      { id: "sans", label: "Modern Sans" },
                      { id: "mono", label: "Folio Mono" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormatting({ ...formatting, bodyFont: f.id as any })}
                        className={`px-3 py-2 rounded-md border text-xs font-medium text-left transition-all cursor-pointer ${
                          formatting.bodyFont === f.id
                            ? "border-[var(--oxblood)] bg-[var(--oxblood-subtle)] text-[var(--oxblood)] font-bold shadow-2xs"
                            : "border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:border-[var(--ink-muted)]"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Spacing & Paragraph Style */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                      Line Spacing
                    </label>
                    <select
                      value={formatting.lineSpacing}
                      onChange={(e) =>
                        setFormatting({ ...formatting, lineSpacing: e.target.value as any })
                      }
                      className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1.5 text-xs text-[var(--ink-primary)]"
                    >
                      <option value="compact">Compact (1.5)</option>
                      <option value="standard">Standard (1.75)</option>
                      <option value="relaxed">Relaxed (2.0)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                      Paragraph Style
                    </label>
                    <select
                      value={formatting.paragraphStyle}
                      onChange={(e) =>
                        setFormatting({ ...formatting, paragraphStyle: e.target.value as any })
                      }
                      className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1.5 text-xs text-[var(--ink-primary)]"
                    >
                      <option value="indented">Indented (Book Style)</option>
                      <option value="spaced">Spaced (Block Style)</option>
                    </select>
                  </div>
                </div>

                {/* Alignment & Reading Width */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                      Text Alignment
                    </label>
                    <div className="flex rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] p-0.5">
                      <button
                        type="button"
                        onClick={() => setFormatting({ ...formatting, alignment: "justify" })}
                        className={`flex-1 flex items-center justify-center py-1 rounded text-xs cursor-pointer ${
                          formatting.alignment === "justify"
                            ? "bg-[var(--oxblood)] text-white font-bold"
                            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                        }`}
                        title="Justified Book Alignment"
                      >
                        <AlignJustify className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormatting({ ...formatting, alignment: "left" })}
                        className={`flex-1 flex items-center justify-center py-1 rounded text-xs cursor-pointer ${
                          formatting.alignment === "left"
                            ? "bg-[var(--oxblood)] text-white font-bold"
                            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                        }`}
                        title="Left Alignment"
                      >
                        <AlignLeft className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                      Reading Width
                    </label>
                    <select
                      value={formatting.readingWidth}
                      onChange={(e) =>
                        setFormatting({ ...formatting, readingWidth: e.target.value as any })
                      }
                      className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1.5 text-xs text-[var(--ink-primary)]"
                    >
                      <option value="narrow">Narrow (600px)</option>
                      <option value="standard">Standard (720px)</option>
                      <option value="wide">Wide (840px)</option>
                    </select>
                  </div>
                </div>

                {/* Chapter Heading Appearance */}
                <div className="space-y-1.5">
                  <label className="block font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    Chapter Heading Appearance
                  </label>
                  <select
                    value={formatting.chapterHeadingStyle}
                    onChange={(e) =>
                      setFormatting({ ...formatting, chapterHeadingStyle: e.target.value as any })
                    }
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1.5 text-xs text-[var(--ink-primary)]"
                  >
                    <option value="roman">Roman Numerals (CHAPTER I)</option>
                    <option value="modern">Modern (Chapter 1)</option>
                    <option value="minimalist">Minimalist (1)</option>
                    <option value="ornamental">Ornamental (— § Part I § —)</option>
                  </select>
                </div>

                {/* Cover Theme Palette */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--editorial-rule)]">
                  <label className="block font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--oxblood)]">
                    Archival Book Cover Palette
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCoverTheme(t.id)}
                        className={`p-2 rounded border text-center transition-all cursor-pointer ${
                          t.bg
                        } ${t.border} ${
                          coverTheme === t.id ? "ring-2 ring-[var(--oxblood)] scale-105" : "opacity-80"
                        }`}
                      >
                        <span className={`font-editorial-mono text-[9px] font-bold uppercase ${t.text}`}>
                          {t.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Book Preview (7 cols) */}
              <div className="lg:col-span-7 flex flex-col rounded-xl border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-4 shadow-inner">
                {/* Preview Leaf Switcher */}
                <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3 mb-4">
                  <div className="font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--oxblood)] flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Live Typographic Book Proof</span>
                  </div>

                  <div className="flex rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewLeaf("TITLE")}
                      className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold cursor-pointer ${
                        previewLeaf === "TITLE"
                          ? "bg-[var(--oxblood)] text-white"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      Title Page
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLeaf("CHAPTER")}
                      className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold cursor-pointer ${
                        previewLeaf === "CHAPTER"
                          ? "bg-[var(--oxblood)] text-white"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      Chapter Leaves
                    </button>
                  </div>
                </div>

                {/* Preview Canvas */}
                <div className="flex-1 overflow-y-auto max-h-[46vh] rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 shadow-xs">
                  {previewLeaf === "TITLE" ? (
                    <div className="text-center space-y-6 py-6 max-w-lg mx-auto">
                      <div className="font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
                        Bound Volume First Edition
                      </div>
                      <h1 className="font-editorial-serif text-3xl font-bold text-[var(--ink-primary)] leading-tight">
                        {bookTitle || "Untitled Volume"}
                      </h1>
                      {bookSubtitle && (
                        <p className="font-editorial-serif italic text-base text-[var(--ink-secondary)]">
                          {bookSubtitle}
                        </p>
                      )}
                      <div className="pt-4 border-t border-[var(--editorial-rule)] font-editorial-mono text-[11px] text-[var(--ink-muted)] space-y-1">
                        <div>Archival Cover Theme: {coverTheme.toUpperCase()}</div>
                        <div>
                          {chapters.length} Chapters · {totalWords.toLocaleString()} Words
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`mx-auto transition-all ${
                        formatting.readingWidth === "narrow"
                          ? "max-w-md"
                          : formatting.readingWidth === "wide"
                          ? "max-w-xl"
                          : "max-w-lg"
                      }`}
                    >
                      {/* Chapter Heading Preview */}
                      <div className="text-center mb-6 space-y-1.5">
                        <div className="font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
                          {formatting.chapterHeadingStyle === "roman" &&
                            `CHAPTER ${toRoman(previewLeafChapterIdx + 1)}`}
                          {formatting.chapterHeadingStyle === "modern" &&
                            `Chapter ${previewLeafChapterIdx + 1}`}
                          {formatting.chapterHeadingStyle === "minimalist" &&
                            `${previewLeafChapterIdx + 1}`}
                          {formatting.chapterHeadingStyle === "ornamental" &&
                            `— § Part ${toRoman(previewLeafChapterIdx + 1)} § —`}
                        </div>
                        <h2 className="font-editorial-serif text-xl font-bold text-[var(--ink-primary)]">
                          {chapters[previewLeafChapterIdx]?.title || "Chapter 1"}
                        </h2>
                      </div>

                      {/* Chapter Body Preview */}
                      <div
                        className={`text-sm text-[var(--ink-primary)] transition-all ${
                          formatting.bodyFont === "sans"
                            ? "font-editorial-sans"
                            : formatting.bodyFont === "mono"
                            ? "font-editorial-mono"
                            : "font-editorial-serif"
                        } ${
                          formatting.lineSpacing === "compact"
                            ? "leading-normal"
                            : formatting.lineSpacing === "relaxed"
                            ? "leading-loose"
                            : "leading-relaxed"
                        } ${
                          formatting.paragraphStyle === "indented"
                            ? "[&_p]:indent-6 [&_p+p]:mt-0 [&_p:first-of-type]:indent-0"
                            : "[&_p]:indent-0 [&_p]:mb-3"
                        } ${formatting.alignment === "justify" ? "text-justify hyphens-auto" : "text-left"}`}
                      >
                        <SafeContentRenderer
                          contentHtml={chapters[previewLeafChapterIdx]?.contentHtml}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: ARCHIVAL CONFIRMATION & PRIVACY ENFORCEMENT                       */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                      Ready to Inscribe &ldquo;{bookTitle}&rdquo;
                    </h3>
                    <p className="font-editorial-sans text-xs text-[var(--ink-secondary)]">
                      All leaves formatted and bound with archival integrity.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-editorial-mono text-xs">
                  <div className="p-3 rounded-lg bg-[var(--paper-surface)] border border-[var(--paper-border)]">
                    <span className="text-[10px] text-[var(--ink-muted)] block uppercase">Chapters</span>
                    <strong className="text-sm text-[var(--ink-primary)]">{chapters.length}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--paper-surface)] border border-[var(--paper-border)]">
                    <span className="text-[10px] text-[var(--ink-muted)] block uppercase">Total Words</span>
                    <strong className="text-sm text-[var(--ink-primary)]">{totalWords.toLocaleString()}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--paper-surface)] border border-[var(--paper-border)]">
                    <span className="text-[10px] text-[var(--ink-muted)] block uppercase">Theme</span>
                    <strong className="text-sm text-[var(--oxblood)] uppercase">{coverTheme}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--paper-surface)] border border-[var(--paper-border)]">
                    <span className="text-[10px] text-[var(--ink-muted)] block uppercase">Format</span>
                    <strong className="text-sm text-[var(--ink-primary)]">
                      {parseResult?.importMethod || "DOCX"}
                    </strong>
                  </div>
                </div>

                {/* Original Document Preservation Notice */}
                {parseResult?.sourceFilename && (
                  <div className="rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-3 flex items-center space-x-3 text-xs">
                    <FileText className="h-5 w-5 text-[var(--oxblood)] shrink-0" />
                    <div>
                      <div className="font-editorial-serif font-bold text-[var(--ink-primary)]">
                        Original Document Preserved
                      </div>
                      <div className="font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                        Source: {parseResult.sourceFilename}{" "}
                        {parseResult.fileSize
                          ? `(${(parseResult.fileSize / 1024).toFixed(1)} KB)`
                          : ""}{" "}
                        · Immutable archival copy stored
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Enforcement Selector */}
                <div className="pt-2 space-y-2">
                  <label className="block font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--oxblood)]">
                    Publication &amp; Privacy Boundary
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibility("PRIVATE")}
                      className={`flex items-start space-x-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                        visibility === "PRIVATE"
                          ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-600"
                          : "border-[var(--paper-border)] bg-[var(--paper-surface)] opacity-70"
                      }`}
                    >
                      <Lock className="h-4 w-4 mt-0.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-editorial-serif font-bold text-xs">Private — Only Me (Default)</div>
                        <div className="font-editorial-sans text-[11px] text-[var(--ink-secondary)] mt-0.5">
                          Accessible strictly to your author account. Hidden from feeds and discovery.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVisibility("PUBLIC")}
                      className={`flex items-start space-x-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                        visibility === "PUBLIC"
                          ? "border-[var(--oxblood)] bg-[var(--oxblood-subtle)] text-[var(--ink-primary)] ring-1 ring-[var(--oxblood)]"
                          : "border-[var(--paper-border)] bg-[var(--paper-surface)] opacity-70"
                      }`}
                    >
                      <Globe className="h-4 w-4 mt-0.5 text-[var(--oxblood)] shrink-0" />
                      <div>
                        <div className="font-editorial-serif font-bold text-xs">Publish — Public Access</div>
                        <div className="font-editorial-sans text-[11px] text-[var(--ink-secondary)] mt-0.5">
                          Bind as live edition visible to readers on discovery shelves.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex items-center justify-between border-t border-[var(--paper-border)] px-6 py-4 bg-[var(--paper-warm)]">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as WizardStep)}
                className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-all cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {step < 4 ? (
              <button
                type="button"
                disabled={step === 1 && !parseResult}
                onClick={() => setStep((s) => (s + 1) as WizardStep)}
                className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-5 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] disabled:opacity-40 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || !bookTitle.trim()}
                className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-6 py-2.5 font-editorial-sans text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[var(--oxblood-hover)] disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
                <span>Inscribe Volume to Ledger</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Formatted Preview Modal (Drill-in) */}
      {previewChapterIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-2xl max-h-[85dvh] flex flex-col rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--paper-border)] px-5 py-3.5 bg-[var(--paper-warm)]">
              <div className="font-editorial-serif font-bold text-base text-[var(--ink-primary)]">
                {chapters[previewChapterIdx]?.title}
              </div>
              <button
                type="button"
                onClick={() => setPreviewChapterIdx(null)}
                className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-editorial-serif text-sm leading-relaxed text-[var(--ink-primary)]">
              <SafeContentRenderer contentHtml={chapters[previewChapterIdx]?.contentHtml} />
            </div>
          </div>
        </div>
      )}

      {/* Split Chapter Modal Tool */}
      {splitModalIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3">
              <h3 className="font-editorial-serif text-base font-bold text-[var(--ink-primary)]">
                Split &ldquo;{chapters[splitModalIdx]?.title}&rdquo;
              </h3>
              <button
                type="button"
                onClick={() => setSplitModalIdx(null)}
                className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs font-editorial-sans text-[var(--ink-secondary)]">
              Enter the exact text snippet, subtitle, or phrase where this chapter should be split into
              two separate chapters.
            </p>

            <input
              type="text"
              value={splitKeyword}
              onChange={(e) => setSplitKeyword(e.target.value)}
              placeholder="e.g. Chapter 1 Part B, or a specific heading"
              className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 text-xs font-editorial-serif text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-none"
              autoFocus
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSplitModalIdx(null)}
                className="px-3 py-1.5 rounded text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSplitChapter(splitModalIdx)}
                disabled={!splitKeyword.trim()}
                className="inline-flex items-center space-x-1.5 rounded bg-[var(--oxblood)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--oxblood-hover)] disabled:opacity-50 cursor-pointer"
              >
                <Split className="h-3 w-3" />
                <span>Split Chapter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

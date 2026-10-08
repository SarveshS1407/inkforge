"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookIdentity,
  CoverDirectionId,
  COVER_DIRECTIONS,
  CoverVersion,
} from "@/types/book";
import { coverService } from "@/lib/cover-generator/service";
import { extractVisualThemes } from "@/lib/cover-generator/prompt-builder";
import { saveBook } from "@/lib/book-store";
import { PhysicalBook } from "@/components/landing/PhysicalBook";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  RefreshCw,
  Upload,
  BookOpen,
  Layers,
  Palette,
  Feather,
  Eye,
  CheckCircle2,
  Info,
} from "lucide-react";

const GENRE_PRESETS = [
  "Literary Fiction",
  "Philosophy & Systems",
  "Technology & Craft",
  "Gothic & Mystery",
  "Poetry & Verse",
  "Speculative Fiction",
  "Personal Essay",
  "Digital Ecology",
];

const MOOD_PRESETS = [
  "Contemplative & Quiet",
  "Atmospheric & Melancholic",
  "Provocative & Urgent",
  "Ethereal & Lyrical",
  "Stark & Modern",
  "Dignified & Archival",
];

export function BookCreationWizard() {
  const router = useRouter();

  // Wizard Steps: 1 = Details, 2 = Directions, 3 = Cover Studio
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState(GENRE_PRESETS[0]);
  const [mood, setMood] = useState(MOOD_PRESETS[0]);
  const [keywordsInput, setKeywordsInput] = useState("");
  const [writingStyle, setWritingStyle] = useState("");

  // Direction & Generation States
  const [selectedDirection, setSelectedDirection] = useState<CoverDirectionId>("editorial");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepMessage, setGenerationStepMessage] = useState("");
  const [previewMode, setPreviewMode] = useState<"book" | "flat">("book");
  const [isBookOpen, setIsBookOpen] = useState(false);

  // Generated Cover Versions
  const [versions, setVersions] = useState<CoverVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");

  const activeVersion = versions.find((v) => v.id === selectedVersionId) || versions[0] || null;

  // Validation
  const canProceedToDirections = title.trim().length > 0 && author.trim().length > 0;

  const handleStartGeneration = async () => {
    setStep(3);
    setIsGenerating(true);
    setGenerationStepMessage("Understanding literary themes and mood...");

    const keywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      setTimeout(() => {
        setGenerationStepMessage("Synthesizing cover direction and negative space...");
      }, 400);

      const result = await coverService.generateCover({
        title,
        subtitle,
        author,
        description: description || `A work in ${genre} exploring ${mood.toLowerCase()} themes.`,
        genre,
        mood,
        keywords,
        direction: selectedDirection,
      });

      const newVersion = coverService.createCoverVersion(result, 1);
      setVersions([newVersion]);
      setSelectedVersionId(newVersion.id);
    } catch (err) {
      console.error("Cover generation failed:", err);
    } finally {
      setIsGenerating(false);
      setGenerationStepMessage("");
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setGenerationStepMessage("Exploring alternate visual composition...");

    const keywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      const result = await coverService.generateCover({
        title,
        subtitle,
        author,
        description,
        genre,
        mood,
        keywords,
        direction: selectedDirection,
      });

      const newVersion = coverService.createCoverVersion(result, versions.length + 1);
      setVersions((prev) => [...prev, newVersion]);
      setSelectedVersionId(newVersion.id);
    } catch (err) {
      console.error("Regeneration error", err);
    } finally {
      setIsGenerating(false);
      setGenerationStepMessage("");
    }
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const uploadedVersion: CoverVersion = {
          id: `cov-upload-${Date.now()}`,
          versionNumber: versions.length + 1,
          directionId: selectedDirection,
          imageUrl: dataUrl,
          palette: {
            clothColor: "#171513",
            accentColor: "#dfb76c",
            foilColor: "#fae6a6",
            paperTone: "cotton",
            textColor: "#ffffff",
          },
          typography: {
            titleFont: "serif",
            style: "debossed-gold",
          },
          artworkSource: "upload",
          createdAt: new Date().toISOString(),
          notes: "Creator uploaded artwork",
        };

        setVersions((prev) => [...prev, uploadedVersion]);
        setSelectedVersionId(uploadedVersion.id);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinalizeBook = () => {
    const keywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const visualThemes = extractVisualThemes(genre, mood, description);
    const bookSlug = (title || "untitled-book")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const newBook: BookIdentity = {
      id: `book-${Date.now()}`,
      slug: bookSlug,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      author: author.trim(),
      description: description.trim() || `A volume in ${genre}.`,
      genre,
      mood,
      keywords,
      writingStyle: writingStyle.trim() || undefined,
      visualThemes,
      tone: mood,
      coverDirection: selectedDirection,
      cover: {
        currentVersionId: activeVersion ? activeVersion.id : "cov-initial",
        versions: versions.length > 0 ? versions : [
          {
            id: "cov-initial",
            versionNumber: 1,
            directionId: selectedDirection,
            palette: {
              clothColor: "#171513",
              accentColor: "#d8a14b",
              foilColor: "#dfb76c",
              paperTone: "cotton",
              textColor: "#fbf9f4",
            },
            typography: {
              titleFont: "serif",
              style: "debossed-gold",
            },
            artworkSource: "curated",
            createdAt: new Date().toISOString(),
          },
        ],
      },
      chapters: [
        {
          id: "ch-1",
          title: "Chapter I: The Beginning",
          order: 1,
          wordCount: 0,
          status: "DRAFT",
        },
      ],
      notesCount: 0,
      state: "NEW",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveBook(newBook);
    router.push(`/books/${newBook.id}`);
  };

  // Mock temporary book identity for live PhysicalBook preview
  const livePreviewBook: BookIdentity = {
    id: "preview-temp",
    slug: "preview-temp",
    title: title || "Your Book Title",
    subtitle: subtitle || "Subtitle or Treatises",
    author: author || "Author Name",
    description: description || "A living digital book created in Inkforge.",
    genre,
    mood,
    keywords: [],
    visualThemes: ["Sovereign Voice", "Enduring Materiality"],
    tone: mood,
    coverDirection: selectedDirection,
    cover: {
      currentVersionId: activeVersion?.id || "temp",
      versions: activeVersion ? [activeVersion] : [],
    },
    chapters: [{ id: "c1", title: "Chapter I", order: 1, wordCount: 0, status: "DRAFT" }],
    notesCount: 0,
    state: "NEW",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Editorial Progress Stepper */}
      <div className="border-b border-[var(--editorial-rule)] pb-6 mb-8">
        <div className="flex items-center justify-between font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
          <span className="text-[var(--oxblood)] font-bold">INKFORGE PUBLISHING HOUSE</span>
          <span>CREATOR STUDIO • STEP {step} OF 3</span>
        </div>

        <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink-primary)] mt-2">
          {step === 1 && "Inscribe a New Work"}
          {step === 2 && "Choose Visual Direction"}
          {step === 3 && "Book Cover & Visual Identity"}
        </h1>

        <p className="font-editorial-serif text-sm sm:text-base text-[var(--ink-secondary)] italic mt-1">
          {step === 1 && "Give your ideas form, title, and literary intent."}
          {step === 2 && "How should this volume present itself to the world?"}
          {step === 3 && "A living physical book, generated specifically for your writing."}
        </p>

        {/* Breadcrumb Steps Bar */}
        <div className="mt-6 flex items-center space-x-3 text-xs font-editorial-mono">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center space-x-1.5 transition-colors ${
              step === 1 ? "text-[var(--oxblood)] font-bold" : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">1</span>
            <span>Manuscript Details</span>
          </button>
          <span className="text-[var(--ink-muted)] opacity-40">→</span>
          <button
            onClick={() => canProceedToDirections && setStep(2)}
            disabled={!canProceedToDirections}
            className={`flex items-center space-x-1.5 transition-colors ${
              step === 2 ? "text-[var(--oxblood)] font-bold" : "text-[var(--ink-muted)] disabled:opacity-40"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">2</span>
            <span>Visual Direction</span>
          </button>
          <span className="text-[var(--ink-muted)] opacity-40">→</span>
          <span
            className={`flex items-center space-x-1.5 ${
              step === 3 ? "text-[var(--oxblood)] font-bold" : "text-[var(--ink-muted)] opacity-40"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">3</span>
            <span>Cover &amp; Identity</span>
          </span>
        </div>
      </div>

      {/* =======================================================================
          STEP 1: INSCRIBE MANUSCRIPT DETAILS
          ======================================================================= */}
      {step === 1 && (
        <div className="grid gap-8 lg:grid-cols-12 items-start animate-fade-in">
          {/* Main Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title & Subtitle */}
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8 space-y-5 shadow-xs">
              <div>
                <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold mb-1.5">
                  Book Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Architecture of Silence"
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-4 py-2.5 font-editorial-serif text-xl sm:text-2xl font-bold text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/50 focus:border-[var(--oxblood)] focus:outline-none focus:ring-1 focus:ring-[var(--oxblood)] transition-all"
                />
              </div>

              <div>
                <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-semibold mb-1.5">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Treatises on Longevity and Quiet Systems"
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-4 py-2 font-editorial-serif text-sm text-[var(--ink-secondary)] italic placeholder-[var(--ink-muted)]/50 focus:border-[var(--oxblood)] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold mb-1.5">
                  Author Name *
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-4 py-2 font-editorial-sans text-sm font-semibold text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/50 focus:border-[var(--oxblood)] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Description / Synopsis */}
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8 space-y-4 shadow-xs">
              <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-bold">
                Synopsis / Premise
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what this book is about. AI uses these themes to direct the cover artwork composition..."
                className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-3.5 font-editorial-serif text-sm leading-relaxed text-[var(--ink-secondary)] placeholder-[var(--ink-muted)]/50 focus:border-[var(--oxblood)] focus:outline-none transition-all"
              />

              {/* Genre & Mood Selector */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <label className="block font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] mb-1.5">
                    Genre / Category
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 font-editorial-sans text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-none"
                  >
                    {GENRE_PRESETS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] mb-1.5">
                    Mood &amp; Tone
                  </label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 font-editorial-sans text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-none"
                  >
                    {MOOD_PRESETS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Keywords */}
              <div className="pt-2">
                <label className="block font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] mb-1.5">
                  Visual Keywords (Comma-separated)
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="e.g. Stone, Horizon, Fog, Solitude, Bronze"
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 font-editorial-sans text-xs text-[var(--ink-secondary)] focus:border-[var(--oxblood)] focus:outline-none"
                />
              </div>
            </div>

            {/* Next Action */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceedToDirections}
                className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-6 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continue to Visual Direction</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Literary Inspiration Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-6 space-y-4 shadow-xs">
              <div className="flex items-center space-x-2 text-[var(--oxblood)] font-editorial-mono text-xs font-bold uppercase tracking-widest">
                <Feather className="h-4 w-4" />
                <span>The Living Book Philosophy</span>
              </div>
              <p className="font-editorial-serif italic text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                &ldquo;You are not publishing another disposable feed post. In INKFORGE, you are binding a sovereign volume that will endure in archival clarity.&rdquo;
              </p>
              <div className="border-t border-[var(--editorial-rule)] pt-3 text-[11px] font-editorial-sans text-[var(--ink-muted)] space-y-2">
                <p>• Titles will be hot-stamped in gold foil.</p>
                <p>• Artwork is generated with ample negative space.</p>
                <p>• Drafts autosave locally in your browser immediately.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          STEP 2: CHOOSE VISUAL DIRECTION
          ======================================================================= */}
      {step === 2 && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2">
            {COVER_DIRECTIONS.map((dir) => {
              const isSelected = selectedDirection === dir.id;

              return (
                <div
                  key={dir.id}
                  onClick={() => setSelectedDirection(dir.id)}
                  className={`group relative rounded-xl border p-6 transition-all cursor-pointer select-none ${
                    isSelected
                      ? "border-[var(--oxblood)] bg-[var(--paper-surface)] shadow-md ring-1 ring-[var(--oxblood)]"
                      : "border-[var(--paper-border)] bg-[var(--paper-canvas)] hover:border-[var(--oxblood)]/50 hover:bg-[var(--paper-surface)]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
                        DIRECTION {dir.id.toUpperCase()}
                      </span>
                      <h3 className="font-editorial-serif text-xl font-bold text-[var(--ink-primary)] mt-1">
                        {dir.name}
                      </h3>
                      <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)] mt-0.5">
                        {dir.tagline}
                      </p>
                    </div>

                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                        isSelected ? "border-[var(--oxblood)] bg-[var(--oxblood)] text-white" : "border-[var(--paper-border)]"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </div>

                  <p className="mt-4 font-editorial-serif text-xs leading-relaxed text-[var(--ink-secondary)]">
                    {dir.description}
                  </p>

                  <div className="mt-4 border-t border-[var(--editorial-rule)] pt-3 font-editorial-mono text-[9px] text-[var(--ink-muted)] space-y-1">
                    <div><span className="font-bold">Aesthetic:</span> {dir.aesthetic}</div>
                    <div><span className="font-bold">Composition:</span> {dir.composition}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--editorial-rule)]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center space-x-1.5 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Details</span>
            </button>

            <button
              type="button"
              onClick={handleStartGeneration}
              className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-6 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-md"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate Book Cover Identity</span>
            </button>
          </div>
        </div>
      )}

      {/* =======================================================================
          STEP 3: COVER IDENTITY STUDIO & LIVE PREVIEWS
          ======================================================================= */}
      {step === 3 && (
        <div className="space-y-8 animate-fade-in">
          {/* Generation In-Progress Overlay Banner */}
          {isGenerating && (
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-6 text-center space-y-3 shadow-xs">
              <RefreshCw className="h-6 w-6 text-[var(--oxblood)] animate-spin mx-auto" />
              <div className="font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] font-bold">
                CRAFTING YOUR BOOK IDENTITY
              </div>
              <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)]">
                {generationStepMessage || "Composing artwork and typography..."}
              </p>
            </div>
          )}

          {/* Main Studio Grid: Left Live Preview (7 cols) + Right Controls (5 cols) */}
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Left Preview Stage (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center">
              {/* Preview Toggle Header */}
              <div className="mb-4 flex items-center space-x-2 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] p-1 font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] shadow-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode("book")}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
                    previewMode === "book" ? "bg-[var(--paper-warm)] font-bold text-[var(--oxblood)] shadow-xs" : "hover:text-[var(--ink-primary)]"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>3D Physical Book</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("flat")}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
                    previewMode === "flat" ? "bg-[var(--paper-warm)] font-bold text-[var(--oxblood)] shadow-xs" : "hover:text-[var(--ink-primary)]"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Flat Plate View</span>
                </button>
              </div>

              {/* The Live Preview Container */}
              {previewMode === "book" ? (
                <div className="w-full flex justify-center py-2">
                  <PhysicalBook
                    isOpen={isBookOpen}
                    onOpen={() => setIsBookOpen(true)}
                    onClose={() => setIsBookOpen(false)}
                    book={livePreviewBook}
                    activeVersion={activeVersion}
                    onMenuAction={(action) => {
                      if (action === "write") handleFinalizeBook();
                    }}
                  />
                </div>
              ) : (
                /* Flat Artwork & Composited Typography Plate */
                <div className="relative w-full max-w-sm aspect-[3/4] rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-8 shadow-2xl overflow-hidden flex flex-col justify-between text-center select-none">
                  {activeVersion?.imageUrl && (
                    <>
                      <img
                        src={activeVersion.imageUrl}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 pointer-events-none" />
                    </>
                  )}

                  {/* Frame */}
                  <div className="absolute inset-4 border border-white/20 rounded-lg pointer-events-none" />

                  {/* Header */}
                  <div className="relative z-10 space-y-1">
                    <div className="font-editorial-mono text-[9px] uppercase tracking-[0.3em] text-[var(--amber-gold)] font-bold">
                      {genre}
                    </div>
                    <div className="font-editorial-mono text-[8px] uppercase tracking-wider text-white/70">
                      By {author}
                    </div>
                  </div>

                  {/* Center Title */}
                  <div className="relative z-10 my-auto py-4 space-y-2">
                    <span className="font-editorial-serif text-xl text-[var(--amber-gold)]">❦</span>
                    <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="font-editorial-serif italic text-xs text-white/80 line-clamp-2">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="relative z-10 pt-2 border-t border-white/20 font-editorial-mono text-[8px] uppercase tracking-widest text-white/60">
                    Inkforge First Edition • Continuous Press
                  </div>
                </div>
              )}
            </div>

            {/* Right Controls & Variations (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Cover Versions Archive */}
              <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-2.5">
                  <span className="font-editorial-mono text-xs font-bold uppercase tracking-wider text-[var(--oxblood)]">
                    Cover History ({versions.length} Version{versions.length === 1 ? "" : "s"})
                  </span>
                  <span className="font-editorial-mono text-[9px] text-[var(--ink-muted)]">
                    Active: Ver. {activeVersion?.versionNumber || 1}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {versions.map((ver) => (
                    <button
                      key={ver.id}
                      type="button"
                      onClick={() => setSelectedVersionId(ver.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-editorial-mono uppercase tracking-wider transition-all border ${
                        selectedVersionId === ver.id
                          ? "bg-[var(--oxblood)] text-white border-[var(--oxblood)] font-bold shadow-xs"
                          : "bg-[var(--paper-canvas)] text-[var(--ink-secondary)] border-[var(--paper-border)] hover:border-[var(--oxblood)]"
                      }`}
                    >
                      Version {ver.versionNumber} ({ver.directionId})
                    </button>
                  ))}
                </div>

                {/* Regenerate & Actions */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3.5 py-1.5 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Regenerate Variation</span>
                  </button>

                  <label className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3.5 py-1.5 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] transition-colors cursor-pointer">
                    <Upload className="h-3 w-3" />
                    <span>Upload Custom</span>
                    <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Direction Switcher */}
              <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-5 space-y-3 shadow-xs">
                <span className="font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  Active Direction: {selectedDirection.toUpperCase()}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-editorial-sans">
                  {COVER_DIRECTIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelectedDirection(d.id);
                        handleStartGeneration();
                      }}
                      className={`p-2 rounded border text-left transition-colors ${
                        selectedDirection === d.id
                          ? "border-[var(--oxblood)] bg-[var(--paper-surface)] font-bold text-[var(--oxblood)]"
                          : "border-[var(--paper-border)] bg-[var(--paper-surface)]/60 text-[var(--ink-secondary)] hover:border-[var(--oxblood)]"
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Info Banner */}
              <div className="rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 text-[11px] font-editorial-mono text-[var(--ink-muted)] space-y-1">
                <div className="flex items-center space-x-1.5 text-[var(--oxblood)] font-bold">
                  <Info className="h-3.5 w-3.5" />
                  <span>Art Engine Status</span>
                </div>
                <p>
                  Provider: <strong className="text-[var(--ink-primary)]">{coverService.getActiveProviderName()}</strong>
                </p>
                <p>
                  Typography is rendered via high-definition CSS overlays with crisp debossing.
                </p>
              </div>

              {/* Final Confirm Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinalizeBook}
                  className="w-full flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] py-3 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-lg active:scale-98"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Accept Cover &amp; Enter Book Workspace</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookIdentity,
  CoverDirectionId,
  COVER_DIRECTIONS,
  CoverVersion,
} from "@/types/book";
import {
  BookVisualContext,
  ConceptDirection,
  ProviderStatus,
  VisualBrief,
} from "@/types/cover-generator";
import { EDITORIAL_TEMPLATES, createTemplateVersion } from "@/lib/cover-generator/templates";
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
  Palette,
  Feather,
  Eye,
  CheckCircle2,
  Info,
  AlertCircle,
  Sliders,
  Trash2,
  Wand2,
} from "lucide-react";

const GENRE_PRESETS = [
  "Biography & Memoir",
  "Philosophy & Systems",
  "Literary Fiction",
  "Science & Nature",
  "Technology & Craft",
  "Psychological Thriller",
  "Poetry & Verse",
  "Personal Essay",
  "Speculative Fiction",
];

const MOOD_PRESETS = [
  "Inspirational & Aspirational",
  "Contemplative & Quiet",
  "Atmospheric & Melancholic",
  "Provocative & Urgent",
  "Ethereal & Lyrical",
  "Stark & Modern",
  "Dignified & Archival",
];

const REFINEMENT_PRESETS = [
  "Make it darker and moodier",
  "Make it more literary and restrained",
  "Make it more cinematic with dramatic lighting",
  "Use a more minimal composition with more negative space",
  "Emphasize the scientific and technical aspect",
  "Emphasize the human warmth and solitude",
];

export function BookCreationWizard() {
  const router = useRouter();

  // Wizard Steps: 1 = Details, 2 = AI Visual Brief & Concepts, 3 = Cover Studio
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
  const [userDirection, setUserDirection] = useState("");

  // AI Pipeline States
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [visualBrief, setVisualBrief] = useState<VisualBrief | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<ConceptDirection | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isGeneratingArtwork, setIsGeneratingArtwork] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refinement State
  const [customRefinement, setCustomRefinement] = useState("");

  // Studio Display States
  const [previewMode, setPreviewMode] = useState<"book" | "flat">("book");
  const [isBookOpen, setIsBookOpen] = useState(false);

  // Generated Cover Versions Archive
  const [versions, setVersions] = useState<CoverVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");

  const activeVersion = versions.find((v) => v.id === selectedVersionId) || versions[0] || null;

  // Check Provider Status on mount
  useEffect(() => {
    fetch("/api/covers/status")
      .then((res) => res.json())
      .then((data: ProviderStatus) => setProviderStatus(data))
      .catch(() =>
        setProviderStatus({
          configured: false,
          message: "Could not reach cover status endpoint.",
        })
      );
  }, []);

  // Validation
  const canProceedToConcepts =
    title.trim().length > 0 &&
    author.trim().length > 0 &&
    description.trim().length > 10;

  // Helper to compile context
  const getContext = (): BookVisualContext => ({
    title: title.trim(),
    subtitle: subtitle.trim() || undefined,
    author: author.trim(),
    description: description.trim(),
    genre,
    mood,
    keywords: keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    writingStyle: writingStyle.trim() || undefined,
    userDirection: userDirection.trim() || undefined,
  });

  // ===========================================================================
  // STAGE 1: VISUAL INTERPRETATION
  // ===========================================================================
  const handleStartInterpretation = async () => {
    setStep(2);
    setErrorMessage(null);

    // If already have brief for same book, don't refetch unless forced
    if (visualBrief && visualBrief.bookTitle === title) {
      return;
    }

    setIsInterpreting(true);
    setPipelineMessage("Reading your book...");

    try {
      const stepTimer1 = setTimeout(() => {
        setPipelineMessage("Finding its themes and visual metaphors...");
      }, 700);

      const stepTimer2 = setTimeout(() => {
        setPipelineMessage("Building its visual identity and distinct concepts...");
      }, 1500);

      const res = await fetch("/api/covers/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: getContext(),
          userDirection,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await res.json();

      if (!res.ok) {
        if (data.unconfigured) {
          setProviderStatus({
            configured: false,
            message: data.error,
          });
        }
        setErrorMessage(data.error || "Interpretation failed.");
        return;
      }

      setVisualBrief(data.brief);
      if (data.brief.concepts && data.brief.concepts.length > 0) {
        setSelectedConcept(data.brief.concepts[0]);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Network error occurred while interpreting manuscript."
      );
    } finally {
      setIsInterpreting(false);
      setPipelineMessage("");
    }
  };

  // ===========================================================================
  // STAGE 2: ARTWORK GENERATION
  // ===========================================================================
  const handleGenerateArtwork = async (concept: ConceptDirection, refinement?: string) => {
    if (!visualBrief) return;

    setStep(3);
    setSelectedConcept(concept);
    setIsGeneratingArtwork(true);
    setErrorMessage(null);
    setPipelineMessage("Composing the cover scene and negative space...");

    try {
      const timer = setTimeout(() => {
        setPipelineMessage("Finishing the museum-grade artwork with DALL-E 3...");
      }, 1500);

      const res = await fetch("/api/covers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: getContext(),
          brief: visualBrief,
          conceptId: concept.id,
          refinement,
        }),
      });

      clearTimeout(timer);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Artwork generation failed.");
        return;
      }

      const generated = data.result;

      // Determine appropriate direction ID
      let dirId: CoverDirectionId = "editorial";
      if (concept.conceptType === "cinematic") dirId = "cinematic";
      else if (concept.conceptType === "experimental") dirId = "experimental";
      else if (concept.conceptType === "metaphor") dirId = "classic";

      const newVersion: CoverVersion = {
        id: generated.id,
        versionNumber: versions.length + 1,
        directionId: dirId,
        imageUrl: generated.imageUrl,
        generatedPrompt: generated.prompt,
        palette: generated.palette,
        typography: generated.typography,
        artworkSource: "ai",
        createdAt: generated.createdAt,
        notes: `${concept.name}: ${concept.summary}`,
        provider: generated.provider,
        model: generated.model,
        conceptName: concept.name,
      };

      setVersions((prev) => [...prev, newVersion]);
      setSelectedVersionId(newVersion.id);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error generating cover artwork."
      );
    } finally {
      setIsGeneratingArtwork(false);
      setPipelineMessage("");
    }
  };

  // Handle Regeneration with Refinement
  const handleRegenerateWithRefinement = async (presetText?: string) => {
    const textToUse = presetText || customRefinement;
    if (!selectedConcept && visualBrief && visualBrief.concepts.length > 0) {
      setSelectedConcept(visualBrief.concepts[0]);
    }
    if (selectedConcept) {
      await handleGenerateArtwork(selectedConcept, textToUse);
      setCustomRefinement("");
    }
  };

  // Non-AI Option 1: Template selection
  const handleSelectTemplate = (templateId: string) => {
    const template = EDITORIAL_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const templateVersion = createTemplateVersion(template, versions.length + 1);
    setVersions((prev) => [...prev, templateVersion]);
    setSelectedVersionId(templateVersion.id);
    setStep(3);
  };

  // Non-AI Option 2: Custom Upload
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
          directionId: "editorial",
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
          conceptName: "Custom Art Upload",
        };

        setVersions((prev) => [...prev, uploadedVersion]);
        setSelectedVersionId(uploadedVersion.id);
        setStep(3);
      }
    };
    reader.readAsDataURL(file);
  };

  // Non-AI Option 3: Continue without artwork
  const handleContinueWithoutCover = () => {
    const defaultTemplate = EDITORIAL_TEMPLATES[0];
    const noArtVersion = createTemplateVersion(defaultTemplate, versions.length + 1);
    setVersions([noArtVersion]);
    setSelectedVersionId(noArtVersion.id);
    handleFinalizeBook(noArtVersion);
  };

  // Delete unused version
  const handleDeleteVersion = (id: string) => {
    if (versions.length <= 1) return;
    const remaining = versions.filter((v) => v.id !== id);
    setVersions(remaining);
    if (selectedVersionId === id) {
      setSelectedVersionId(remaining[0].id);
    }
  };

  // Save book and navigate to workspace
  const handleFinalizeBook = (overrideVersion?: CoverVersion) => {
    const chosenVersion = overrideVersion || activeVersion;

    const keywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

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
      visualThemes: visualBrief ? visualBrief.themes : ["Enduring Materiality"],
      tone: mood,
      coverDirection: chosenVersion ? chosenVersion.directionId : "editorial",
      cover: {
        currentVersionId: chosenVersion ? chosenVersion.id : "cov-initial",
        versions: versions.length > 0 ? versions : chosenVersion ? [chosenVersion] : [],
      },
      chapters: [
        {
          id: "ch-1",
          title: "Chapter I: The Inception",
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
    visualThemes: visualBrief?.themes || ["Sovereign Voice", "Enduring Materiality"],
    tone: mood,
    coverDirection: activeVersion?.directionId || "editorial",
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
          {step === 2 && "Visual Understanding & Concepts"}
          {step === 3 && "Cover Identity Studio"}
        </h1>

        <p className="font-editorial-serif text-sm sm:text-base text-[var(--ink-secondary)] italic mt-1">
          {step === 1 && "“Every book should look like its story.” Provide its foundation."}
          {step === 2 && "INKFORGE analyzes what your book is truly about and derives 4 distinct visual concepts."}
          {step === 3 && "Audition, refine, and bind the living physical cover for your volume."}
        </p>

        {/* Breadcrumb Steps Bar */}
        <div className="mt-6 flex items-center space-x-3 text-xs font-editorial-mono">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center space-x-1.5 transition-colors ${
              step === 1
                ? "text-[var(--oxblood)] font-bold"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
              1
            </span>
            <span>Manuscript Details</span>
          </button>
          <span className="text-[var(--ink-muted)] opacity-40">→</span>
          <button
            onClick={() => canProceedToConcepts && handleStartInterpretation()}
            disabled={!canProceedToConcepts}
            className={`flex items-center space-x-1.5 transition-colors ${
              step === 2
                ? "text-[var(--oxblood)] font-bold"
                : "text-[var(--ink-muted)] disabled:opacity-40"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
              2
            </span>
            <span>AI Concepts</span>
          </button>
          <span className="text-[var(--ink-muted)] opacity-40">→</span>
          <span
            className={`flex items-center space-x-1.5 ${
              step === 3 ? "text-[var(--oxblood)] font-bold" : "text-[var(--ink-muted)] opacity-40"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
              3
            </span>
            <span>Cover Studio</span>
          </span>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50/70 p-4 text-xs font-editorial-sans text-red-800 flex items-start space-x-2.5">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold">Notice:</strong> {errorMessage}
          </div>
        </div>
      )}

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
                  placeholder="e.g. Wings of Fire, The Architecture of Silence"
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
                  placeholder="e.g. An Autobiography of Perseverance and Science"
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
                  placeholder="e.g. A.P.J. Abdul Kalam, Elena Rostova"
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-4 py-2 font-editorial-sans text-sm font-semibold text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/50 focus:border-[var(--oxblood)] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Description / Synopsis */}
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8 space-y-4 shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold">
                    Manuscript Description &amp; Synopsis *
                  </label>
                  <span className="font-editorial-mono text-[9px] text-[var(--ink-muted)]">
                    Used to extract visual metaphors &amp; themes
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe what this book is about in depth: the story arc, core conflicts, historical or emotional themes... The AI understands the story itself, rather than merely illustrating the title words."
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-3.5 font-editorial-serif text-sm leading-relaxed text-[var(--ink-secondary)] placeholder-[var(--ink-muted)]/50 focus:border-[var(--oxblood)] focus:outline-none transition-all"
                />
              </div>

              {/* Genre & Mood Selector */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <label className="block font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] mb-1.5">
                    Genre / Field
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
                    Emotional Tone &amp; Mood
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
                  Motifs &amp; Keywords (Optional)
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="e.g. flight, aerospace, perseverance, dawn horizon, leadership"
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 font-editorial-sans text-xs text-[var(--ink-secondary)] focus:border-[var(--oxblood)] focus:outline-none"
                />
              </div>

              {/* Optional Custom Visual Direction */}
              <div className="pt-2">
                <label className="block font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] mb-1.5">
                  Custom Art Direction (Optional)
                </label>
                <input
                  type="text"
                  value={userDirection}
                  onChange={(e) => setUserDirection(e.target.value)}
                  placeholder="e.g. 'Make it feel like an archival 1960s aerospace laboratory photograph mixed with modern Swiss editorial design'"
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 font-editorial-sans text-xs text-[var(--ink-secondary)] italic focus:border-[var(--oxblood)] focus:outline-none"
                />
              </div>
            </div>

            {/* Next Action */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleContinueWithoutCover}
                className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
              >
                Continue without cover
              </button>

              <button
                type="button"
                onClick={handleStartInterpretation}
                disabled={!canProceedToConcepts}
                className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-6 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Understand Story &amp; Generate Concepts</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Editorial Architecture Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-6 space-y-4 shadow-xs">
              <div className="flex items-center space-x-2 text-[var(--oxblood)] font-editorial-mono text-xs font-bold uppercase tracking-widest">
                <Feather className="h-4 w-4" />
                <span>Publishing Doctrine</span>
              </div>
              <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                &ldquo;Every book should look like its story.&rdquo;
              </h3>
              <p className="font-editorial-serif italic text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                We do not paste random wings onto a book titled Wings of Fire. INKFORGE translates the manuscript’s actual narrative arc into visual metaphors, physical binding palettes, and deliberate negative space.
              </p>
              <div className="border-t border-[var(--editorial-rule)] pt-3 text-[11px] font-editorial-sans text-[var(--ink-muted)] space-y-2">
                <p>• <strong>Two-stage pipeline:</strong> Visual Interpretation → Image Synthesis.</p>
                <p>• <strong>Zero text hallucination:</strong> Artwork provides the canvas; INKFORGE renders crisp typography in HTML/CSS.</p>
                <p>• <strong>Unblocked authorship:</strong> Handcrafted editorial templates and file upload are always available.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          STEP 2: VISUAL UNDERSTANDING & 4 CONCEPTS
          ======================================================================= */}
      {step === 2 && (
        <div className="space-y-8 animate-fade-in">
          {/* Real Pipeline Loading Banner */}
          {isInterpreting && (
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-8 text-center space-y-3 shadow-xs">
              <RefreshCw className="h-7 w-7 text-[var(--oxblood)] animate-spin mx-auto" />
              <div className="font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] font-bold">
                STAGE 1: VISUAL INTERPRETATION
              </div>
              <p className="font-editorial-serif italic text-base text-[var(--ink-primary)]">
                {pipelineMessage || "Reading your manuscript..."}
              </p>
              <p className="font-editorial-mono text-[10px] text-[var(--ink-muted)] max-w-md mx-auto">
                Extracting core themes, narrative arcs, and symbolic visual metaphors.
              </p>
            </div>
          )}

          {/* Unconfigured Provider State Notice */}
          {!isInterpreting && providerStatus && !providerStatus.configured && (
            <div className="rounded-xl border border-[var(--amber-gold)]/40 bg-[var(--paper-warm)] p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-[var(--amber-gold)] shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                    AI Cover Generation Engine Setup Required
                  </h3>
                  <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] leading-relaxed">
                    INKFORGE never fakes image generation or substitutes stock gradients. To enable real AI book cover synthesis, configure an image provider in your environment:
                  </p>
                  <pre className="rounded bg-[var(--paper-canvas)] p-3 font-editorial-mono text-xs text-[var(--oxblood)] border border-[var(--paper-border)]">
                    OPENAI_API_KEY=your_openai_api_key_here
                  </pre>
                  <p className="font-editorial-sans text-xs text-[var(--ink-muted)]">
                    Add the key above to <code className="text-[var(--ink-primary)] font-bold">.env</code> and restart your development server to enable full DALL-E 3 &amp; GPT-4o synthesis.
                  </p>
                </div>
              </div>

              {/* Immediate Fallback Choices */}
              <div className="border-t border-[var(--editorial-rule)] pt-4 space-y-3">
                <span className="font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold">
                  Continue Immediately Without AI Key:
                </span>
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate(EDITORIAL_TEMPLATES[0].id)}
                    className="p-3 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] text-left hover:border-[var(--oxblood)] transition-colors"
                  >
                    <span className="font-editorial-serif font-bold text-xs text-[var(--ink-primary)] block">
                      Editorial Template
                    </span>
                    <span className="text-[11px] text-[var(--ink-muted)]">
                      Classic Oxford navy buckram with gold foil.
                    </span>
                  </button>

                  <label className="p-3 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] text-left hover:border-[var(--oxblood)] transition-colors cursor-pointer">
                    <span className="font-editorial-serif font-bold text-xs text-[var(--ink-primary)] block">
                      Upload Custom Cover
                    </span>
                    <span className="text-[11px] text-[var(--ink-muted)]">
                      Use your own artwork or book jacket file.
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleContinueWithoutCover}
                    className="p-3 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] text-left hover:border-[var(--oxblood)] transition-colors"
                  >
                    <span className="font-editorial-serif font-bold text-xs text-[var(--ink-primary)] block">
                      Plain Bookcloth
                    </span>
                    <span className="text-[11px] text-[var(--ink-muted)]">
                      Bind in dignified archival cloth right away.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Visual Brief Results */}
          {!isInterpreting && visualBrief && (
            <div className="space-y-6">
              {/* Understanding Summary Card */}
              <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-2.5">
                  <span className="font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
                    WHAT INKFORGE UNDERSTOOD ABOUT YOUR STORY
                  </span>
                  <span className="font-editorial-mono text-[9px] text-[var(--ink-muted)]">
                    Subject Analysis: &ldquo;{visualBrief.bookTitle}&rdquo;
                  </span>
                </div>

                <p className="font-editorial-serif italic text-base text-[var(--ink-primary)] leading-relaxed">
                  &ldquo;{visualBrief.subject}&rdquo;
                </p>

                {/* Extracted Themes & Metaphors Chips */}
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <span className="block font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] mb-1.5 font-bold">
                      Identified Themes:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {visualBrief.themes.map((t, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-[var(--paper-warm)] px-2.5 py-0.5 font-editorial-mono text-[10px] text-[var(--ink-secondary)] border border-[var(--paper-border)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] mb-1.5 font-bold">
                      Visual Metaphors:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {visualBrief.visualMetaphors.map((vm, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-[var(--oxblood)]/10 px-2.5 py-0.5 font-editorial-mono text-[10px] text-[var(--oxblood)] font-semibold border border-[var(--oxblood)]/20"
                        >
                          {vm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Distinct Concepts Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                    4 Story-Derived Cover Concepts
                  </h2>
                  <span className="font-editorial-mono text-xs text-[var(--ink-muted)]">
                    Select a concept to synthesize artwork with DALL-E 3
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {visualBrief.concepts.map((concept) => {
                    const isSelected = selectedConcept?.id === concept.id;

                    return (
                      <div
                        key={concept.id}
                        onClick={() => setSelectedConcept(concept)}
                        className={`group relative rounded-xl border p-6 flex flex-col justify-between transition-all cursor-pointer select-none ${
                          isSelected
                            ? "border-[var(--oxblood)] bg-[var(--paper-surface)] shadow-md ring-1 ring-[var(--oxblood)]"
                            : "border-[var(--paper-border)] bg-[var(--paper-canvas)] hover:border-[var(--oxblood)]/50 hover:bg-[var(--paper-surface)]"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
                                CONCEPT {concept.id.toUpperCase().replace("CONCEPT-", "")} •{" "}
                                {concept.conceptType.toUpperCase()}
                              </span>
                              <h3 className="font-editorial-serif text-xl font-bold text-[var(--ink-primary)] mt-0.5">
                                {concept.name}
                              </h3>
                            </div>

                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                                isSelected
                                  ? "border-[var(--oxblood)] bg-[var(--oxblood)] text-white"
                                  : "border-[var(--paper-border)]"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </div>

                          <p className="font-editorial-serif italic text-xs sm:text-sm text-[var(--ink-secondary)]">
                            {concept.summary}
                          </p>

                          <div className="border-t border-[var(--editorial-rule)] pt-2.5">
                            <span className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] font-bold block mb-1">
                              Why this fits your story:
                            </span>
                            <p className="font-editorial-sans text-xs text-[var(--ink-secondary)] leading-relaxed">
                              {concept.rationale}
                            </p>
                          </div>

                          {/* Binding Palette Preview */}
                          <div className="flex items-center space-x-2 pt-1">
                            <span className="font-editorial-mono text-[9px] uppercase text-[var(--ink-muted)]">
                              Palette:
                            </span>
                            <div className="flex items-center space-x-1">
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20"
                                style={{ backgroundColor: concept.recommendedPalette.clothColor }}
                                title="Cloth Binding Color"
                              />
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20"
                                style={{ backgroundColor: concept.recommendedPalette.accentColor }}
                                title="Accent Color"
                              />
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20"
                                style={{ backgroundColor: concept.recommendedPalette.foilColor }}
                                title="Foil Color"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Concept Action */}
                        <div className="pt-4 mt-4 border-t border-[var(--editorial-rule)] flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateArtwork(concept);
                            }}
                            className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-md"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Synthesize Artwork</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Handcrafted Templates Shelf */}
              <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-6 space-y-4">
                <span className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold">
                  Or Choose a Handcrafted Editorial Template:
                </span>
                <div className="grid gap-4 sm:grid-cols-4">
                  {EDITORIAL_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className="p-3 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] text-left hover:border-[var(--oxblood)] transition-all group"
                    >
                      <div
                        className="h-10 w-full rounded mb-2 border border-black/10 flex items-center justify-center font-editorial-serif text-xs font-bold"
                        style={{
                          backgroundColor: tmpl.palette.clothColor,
                          color: tmpl.palette.textColor,
                        }}
                      >
                        ❦
                      </div>
                      <span className="font-editorial-serif font-bold text-xs text-[var(--ink-primary)] block group-hover:text-[var(--oxblood)]">
                        {tmpl.name}
                      </span>
                      <span className="text-[10px] text-[var(--ink-muted)] line-clamp-1">
                        {tmpl.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--editorial-rule)]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center space-x-1.5 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Details</span>
                </button>

                {selectedConcept && (
                  <button
                    type="button"
                    onClick={() => handleGenerateArtwork(selectedConcept)}
                    className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-6 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-md"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    <span>Synthesize {selectedConcept.name}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          STEP 3: COVER IDENTITY STUDIO & REFINEMENTS
          ======================================================================= */}
      {step === 3 && (
        <div className="space-y-8 animate-fade-in">
          {/* Real Image Generation Loading Banner */}
          {isGeneratingArtwork && (
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-8 text-center space-y-3 shadow-xs">
              <RefreshCw className="h-7 w-7 text-[var(--oxblood)] animate-spin mx-auto" />
              <div className="font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] font-bold">
                STAGE 2: IMAGE SYNTHESIS
              </div>
              <p className="font-editorial-serif italic text-base text-[var(--ink-primary)]">
                {pipelineMessage || "Composing artwork with DALL-E 3..."}
              </p>
              <p className="font-editorial-mono text-[10px] text-[var(--ink-muted)] max-w-md mx-auto">
                Portrait book jacket orientation • Preserving quiet negative space for typography.
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
                    previewMode === "book"
                      ? "bg-[var(--paper-warm)] font-bold text-[var(--oxblood)] shadow-xs"
                      : "hover:text-[var(--ink-primary)]"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>3D Physical Book</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("flat")}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
                    previewMode === "flat"
                      ? "bg-[var(--paper-warm)] font-bold text-[var(--oxblood)] shadow-xs"
                      : "hover:text-[var(--ink-primary)]"
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
                <div
                  className="relative w-full max-w-sm aspect-[3/4] rounded-xl border border-[var(--paper-border)] p-8 shadow-2xl overflow-hidden flex flex-col justify-between text-center select-none"
                  style={{
                    backgroundColor: activeVersion?.palette?.clothColor || "#171513",
                  }}
                >
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
                    Inkforge First Edition • Bound Volume
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
                    <div key={ver.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => setSelectedVersionId(ver.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-editorial-mono uppercase tracking-wider transition-all border ${
                          selectedVersionId === ver.id
                            ? "bg-[var(--oxblood)] text-white border-[var(--oxblood)] font-bold shadow-xs"
                            : "bg-[var(--paper-canvas)] text-[var(--ink-secondary)] border-[var(--paper-border)] hover:border-[var(--oxblood)]"
                        }`}
                      >
                        Ver. {ver.versionNumber} ({ver.conceptName || ver.artworkSource})
                      </button>
                      {versions.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVersion(ver.id);
                          }}
                          className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete version"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Upload & Back Actions */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <label className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3.5 py-1.5 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] transition-colors cursor-pointer">
                    <Upload className="h-3 w-3" />
                    <span>Upload Art</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3.5 py-1.5 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
                  >
                    <span>Try Another Concept</span>
                  </button>
                </div>
              </div>

              {/* Refinement Panel */}
              <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center space-x-1.5 text-[var(--oxblood)] font-editorial-mono text-xs font-bold uppercase tracking-wider">
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Refine Artwork Interpretation</span>
                </div>

                <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)]">
                  Modify the visual synthesis while preserving the underlying book story.
                </p>

                {/* Quick Refinement Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {REFINEMENT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isGeneratingArtwork}
                      onClick={() => handleRegenerateWithRefinement(preset)}
                      className="rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1 font-editorial-sans text-[11px] text-[var(--ink-secondary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] transition-colors text-left disabled:opacity-40"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                {/* Custom Refinement Input */}
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={customRefinement}
                    onChange={(e) => setCustomRefinement(e.target.value)}
                    placeholder="e.g. Add subtle warm copper accents on the horizon..."
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-1.5 font-editorial-sans text-xs text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/50 focus:border-[var(--oxblood)] focus:outline-none"
                  />

                  <button
                    type="button"
                    disabled={isGeneratingArtwork || !customRefinement.trim()}
                    onClick={() => handleRegenerateWithRefinement()}
                    className="w-full inline-flex items-center justify-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all disabled:opacity-40"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Regenerate with Refinement</span>
                  </button>
                </div>
              </div>

              {/* Provider Info Banner */}
              <div className="rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 text-[11px] font-editorial-mono text-[var(--ink-muted)] space-y-1">
                <div className="flex items-center space-x-1.5 text-[var(--oxblood)] font-bold">
                  <Info className="h-3.5 w-3.5" />
                  <span>Art Pipeline Details</span>
                </div>
                <p>
                  Artwork Model:{" "}
                  <strong className="text-[var(--ink-primary)]">
                    {activeVersion?.model || "DALL-E 3 & GPT-4o"}
                  </strong>
                </p>
                <p>
                  Typography: <strong className="text-[var(--ink-primary)]">Charter Serif (CSS Composited)</strong>
                </p>
                <p className="text-[10px] italic pt-0.5">
                  The generated image is safely stored in local assets and bound to this volume.
                </p>
              </div>

              {/* Final Confirm Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleFinalizeBook()}
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

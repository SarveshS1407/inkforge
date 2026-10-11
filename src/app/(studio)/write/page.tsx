"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Header } from "@/components/navigation/Header";
import { getBookById, saveBook } from "@/lib/book-store";
import { BookIdentity } from "@/types/book";

const Editor = dynamic(
  () => import("@/components/editor/Editor").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] text-[var(--ink-muted)] font-editorial-mono text-xs shadow-xs">
        <span className="animate-pulse">Loading Writing Canvas...</span>
      </div>
    ),
  }
);
import {
  Save,
  Send,
  Calendar,
  Clock,
  Feather,
  CheckCircle2,
  BookOpen,
  Eye,
  Edit3,
  Target,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  HelpCircle,
  FileText,
} from "lucide-react";

function WritePageContent() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get("bookId");
  const [activeBook, setActiveBook] = useState<BookIdentity | null>(null);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [publication, setPublication] = useState("Architecture & Craft");
  const [status, setStatus] = useState<"DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED">("DRAFT");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);
  const [words, setWords] = useState(0);
  const [proofMode, setProofMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [targetWords, setTargetWords] = useState(1200);

  // Load existing draft or active book
  useEffect(() => {
    if (bookId) {
      const book = getBookById(bookId);
      if (book) {
        setActiveBook(book);
        setTitle(book.title);
        setExcerpt(book.description);
        setPublication(book.genre);
        if (book.chapters && book.chapters.length > 0) {
          const ch = book.chapters[0];
          if (ch.wordCount) setWords(ch.wordCount);
        }
        return;
      }
    }

    const savedDraft = localStorage.getItem("inkforge_active_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.excerpt) setExcerpt(parsed.excerpt);
        if (parsed.contentHtml) {
          setContentHtml(parsed.contentHtml);
          const plainText = parsed.contentHtml.replace(/<[^>]*>/g, " ").trim();
          const initialWordCount = plainText.split(/\s+/).filter(Boolean).length;
          setWords(initialWordCount);
        }
        if (parsed.status) setStatus(parsed.status);
        if (parsed.publication) setPublication(parsed.publication);
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
  }, [bookId]);

  // Save handler with local persistence
  const handleSave = useCallback(
    async (targetStatus = status) => {
      setIsSaving(true);
      const draftData = {
        title: title || "Untitled Document",
        excerpt,
        contentHtml,
        publication,
        status: targetStatus,
        scheduledFor: targetStatus === "SCHEDULED" ? scheduledDate : null,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem("inkforge_active_draft", JSON.stringify(draftData));

      try {
        const existingRaw = localStorage.getItem("inkforge_all_posts") || "[]";
        const existing = JSON.parse(existingRaw);
        const postSlug = (title || "untitled-document")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const index = existing.findIndex((p: { slug: string }) => p.slug === postSlug);
        const postRecord = {
          id: `post-${Date.now()}`,
          ...draftData,
          slug: postSlug,
          author: {
            name: "Resident Author",
            role: "Editorial Fellow",
          },
        };

        if (index >= 0) {
          existing[index] = postRecord;
        } else {
          existing.unshift(postRecord);
        }

        localStorage.setItem("inkforge_all_posts", JSON.stringify(existing));

        if (activeBook) {
          const updatedBook: BookIdentity = {
            ...activeBook,
            title: title || activeBook.title,
            description: excerpt || activeBook.description,
            chapters:
              activeBook.chapters.length > 0
                ? [{ ...activeBook.chapters[0], wordCount: words, excerpt }]
                : [{ id: "ch-1", title: title || "Chapter I", order: 1, wordCount: words, status: "DRAFT" }],
            state: "IN_PROGRESS",
          };
          saveBook(updatedBook);
        }
      } catch (err) {
        console.error("Persistence error", err);
      }

      setTimeout(() => {
        setIsSaving(false);
        setIsDirty(false);
        setSavedNotification(true);
        setTimeout(() => setSavedNotification(false), 2600);
      }, 240);
    },
    [title, excerpt, contentHtml, publication, status, scheduledDate, words, activeBook]
  );

  // Global Cmd+S save shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave(status);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, status]);

  const calculateRhythm = () => {
    if (words === 0) return "Blank Leaf";
    if (words < 300) return "Epigram / Sketch";
    if (words < 800) return "Critical Essay";
    if (words < 1800) return "Treatise";
    return "Extended Monograph";
  };

  const progressPct = Math.min(100, Math.round((words / targetWords) * 100));

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      {/* Global Header (Hidden during solitary Focus Mode) */}
      {!focusMode && <Header />}

      {/* Floating Focus Mode Bar */}
      {focusMode && (
        <aside
          aria-label="Focus Mode Bar"
          className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--editorial-rule)] bg-[var(--paper-canvas)]/95 px-6 py-2.5 backdrop-blur-md"
        >
          <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--oxblood)] animate-pulse" />
            <span className="font-bold text-[var(--oxblood)]">Solitary Focus Mode</span>
            <span>•</span>
            <span>{words.toLocaleString()} words</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleSave(status)}
              className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-1 text-xs font-editorial-sans text-[var(--ink-primary)] hover:border-[var(--oxblood)]"
            >
              <Save className="h-3 w-3 text-[var(--oxblood)]" />
              <span>{isSaving ? "Saving..." : "Save Draft"}</span>
            </button>
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--paper-warm)] border border-[var(--paper-border)] px-3 py-1 font-editorial-sans text-xs text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors"
            >
              <Minimize2 className="h-3 w-3" />
              <span>Exit Focus Mode</span>
            </button>
          </div>
        </aside>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Active Book Identity Banner if present */}
        {activeBook && !focusMode && (
          <div className="mb-6 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-warm)] p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-4 w-4 text-[var(--oxblood)]" />
              <div>
                <span className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                  Active Volume Manuscript • {activeBook.genre}
                </span>
                <h4 className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)]">
                  {activeBook.title}{" "}
                  <span className="font-normal italic text-xs text-[var(--ink-secondary)]">
                    by {activeBook.author}
                  </span>
                </h4>
              </div>
            </div>
            <Link
              href={`/books/${activeBook.id}`}
              className="inline-flex items-center space-x-1 font-editorial-mono text-[10px] uppercase text-[var(--oxblood)] hover:underline font-bold"
            >
              <span>Book Workspace</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* ===================================================================
            REORGANIZED 3-REGION EDITOR HEADER
            Region A: Document Info | Region B: Stats | Region C: Actions
            =================================================================== */}
        {!focusMode && (
          <header className="mb-8 border-b border-[var(--editorial-rule)] pb-6 space-y-5">
            {/* Top Tier: Region A (Document Info) + Region C (Primary Actions) */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* REGION A: DOCUMENT INFORMATION */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2 font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
                  <span className="font-bold text-[var(--oxblood)]">Writing Studio</span>
                  <span>•</span>
                  <span>{activeBook ? activeBook.genre : "Folio IF-SCRIBE-2026"}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <h1 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[var(--ink-primary)] tracking-tight truncate max-w-sm sm:max-w-md">
                    {title || "Untitled Document"}
                  </h1>

                  {/* Live Save Status Badge */}
                  <span
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-editorial-mono uppercase tracking-wider border transition-colors ${
                      isSaving
                        ? "bg-[var(--paper-warm)] border-[var(--amber-gold)] text-[var(--amber-gold)]"
                        : isDirty
                        ? "bg-[var(--paper-warm)] border-[var(--paper-border)] text-[var(--ink-muted)]"
                        : status === "PUBLISHED"
                        ? "bg-[var(--paper-warm)] border-[var(--forest)] text-[var(--forest)] font-bold"
                        : "bg-[var(--oxblood-subtle)] border-[var(--oxblood)]/30 text-[var(--oxblood)] font-bold"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSaving
                          ? "bg-[var(--amber-gold)] animate-pulse"
                          : isDirty
                          ? "bg-[var(--amber-gold)]"
                          : status === "PUBLISHED"
                          ? "bg-[var(--forest)]"
                          : "bg-[var(--oxblood)]"
                      }`}
                    />
                    <span>
                      {isSaving
                        ? "Saving..."
                        : isDirty
                        ? "Unsaved changes"
                        : status === "PUBLISHED"
                        ? "Published · Saved"
                        : "Draft · Saved"}
                    </span>
                  </span>
                </div>
              </div>

              {/* REGION C: DOCUMENT ACTIONS */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Secondary: My Drafts */}
                <Link
                  href="/posts"
                  className="h-9 inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 text-xs font-editorial-sans text-[var(--ink-secondary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] transition-colors shadow-2xs"
                  title="View all saved drafts and publications"
                >
                  <FileText className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                  <span className="hidden sm:inline">My Drafts</span>
                </Link>

                {/* Secondary: Publication Category Selector */}
                <select
                  value={publication}
                  onChange={(e) => {
                    setPublication(e.target.value);
                    setIsDirty(true);
                  }}
                  className="h-9 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 text-xs font-editorial-sans text-[var(--ink-primary)] shadow-2xs focus:border-[var(--oxblood)] focus:outline-hidden"
                  title="Select publication venue"
                >
                  <option value="Architecture & Craft">Architecture &amp; Craft</option>
                  <option value="Digital Ecology">Digital Ecology</option>
                  <option value="Inkforge Engineering">Inkforge Engineering</option>
                  <option value="Literary Review">The Literary Review</option>
                </select>

                {/* Secondary: Lifecycle Status Selector */}
                <select
                  value={status}
                  onChange={(e) => {
                    const nextStatus = e.target.value as typeof status;
                    setStatus(nextStatus);
                    setIsDirty(true);
                  }}
                  className="h-9 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 text-xs font-editorial-sans text-[var(--ink-primary)] shadow-2xs focus:border-[var(--oxblood)] focus:outline-hidden"
                  title="Document publication lifecycle state"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="IN_REVIEW">Submit for Review</option>
                  <option value="SCHEDULED">Schedule Edition</option>
                  <option value="PUBLISHED">Published</option>
                </select>

                {/* Scheduled DateTime picker if applicable */}
                {status === "SCHEDULED" && (
                  <div className="h-9 flex items-center space-x-1 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2 text-xs shadow-2xs">
                    <Calendar className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => {
                        setScheduledDate(e.target.value);
                        setIsDirty(true);
                      }}
                      className="bg-transparent text-xs text-[var(--ink-primary)] focus:outline-hidden font-editorial-mono"
                    />
                  </div>
                )}

                {/* Focus Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setFocusMode(true)}
                  className="h-9 inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 text-xs font-editorial-sans text-[var(--ink-secondary)] hover:border-[var(--oxblood)] hover:text-[var(--ink-primary)] transition-colors shadow-2xs"
                  title="Enter distraction-free Focus Mode"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Focus</span>
                </button>

                {/* Preview Toggle (Replaces Galley Proof) */}
                <button
                  type="button"
                  onClick={() => setProofMode(!proofMode)}
                  className={`h-9 inline-flex items-center space-x-1.5 rounded-md px-3 text-xs font-editorial-sans border transition-colors shadow-2xs ${
                    proofMode
                      ? "bg-[var(--oxblood)] text-white border-[var(--oxblood)] font-semibold"
                      : "border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:border-[var(--oxblood)]"
                  }`}
                  title="Toggle Reader Preview"
                >
                  {proofMode ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-[var(--ink-muted)]" />}
                  <span>{proofMode ? "Editor" : "Preview"}</span>
                </button>

                {/* Primary: Save Draft */}
                <button
                  type="button"
                  onClick={() => handleSave(status)}
                  disabled={isSaving}
                  className="h-9 inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 text-xs font-editorial-sans font-medium text-[var(--ink-primary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] shadow-2xs transition-colors disabled:opacity-40"
                  title="Save Draft (Cmd+S)"
                >
                  <Save className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                  <span>{isSaving ? "Saving..." : "Save Draft"}</span>
                </button>

                {/* Primary: Publish (Prominent) */}
                <button
                  type="button"
                  onClick={() => {
                    setStatus("PUBLISHED");
                    handleSave("PUBLISHED");
                  }}
                  className="h-9 inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-2xs hover:bg-[var(--oxblood-hover)] transition-all active:scale-[0.98]"
                  title="Publish piece to public archive"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Publish</span>
                </button>
              </div>
            </div>

            {/* Bottom Tier: REGION B (Writing Statistics) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3.5 py-1.5 font-editorial-mono text-xs text-[var(--ink-muted)] shadow-2xs">
                {/* Word Count & Editable Target */}
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-[var(--ink-primary)]">{words.toLocaleString()}</span>
                  <span>/</span>
                  <button
                    type="button"
                    onClick={() => {
                      const options = [500, 800, 1200, 2000, 3000];
                      const next = options[(options.indexOf(targetWords) + 1) % options.length] || 1200;
                      setTargetWords(next);
                    }}
                    className="font-bold text-[var(--oxblood)] hover:underline"
                    title="Click to cycle word goal (500, 800, 1200, 2000, 3000)"
                  >
                    {targetWords.toLocaleString()} words
                  </button>
                </div>

                <span>•</span>

                {/* Estimated Book Pages with Tooltip */}
                <div className="relative group cursor-help flex items-center space-x-1">
                  <span>~{(words / 280).toFixed(1)} pages</span>
                  <HelpCircle className="h-3 w-3 opacity-50" />
                  <div className="hidden group-hover:block absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2 py-1 text-[10px] text-[var(--ink-secondary)] shadow-md whitespace-nowrap">
                    Estimated at standard ~250–300 words per book page
                  </div>
                </div>

                <span>•</span>

                {/* Estimated Reading Time */}
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 opacity-60" />
                  <span>{Math.max(1, Math.ceil(words / 220))} min read</span>
                </div>

                <span>•</span>

                {/* Literary Rhythm */}
                <span className="font-semibold uppercase text-[10px] text-[var(--oxblood)]">
                  {calculateRhythm()}
                </span>

                {/* Mini Target Progress Bar */}
                <div className="w-16 h-1.5 rounded-full bg-[var(--paper-warm)] border border-[var(--paper-border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--oxblood)] transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] font-editorial-mono text-[var(--ink-muted)] hidden sm:block">
                Press <kbd className="px-1.5 py-0.5 rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] text-[10px]">Cmd+S</kbd> to save anytime
              </div>
            </div>
          </header>
        )}

        {/* Live Saved Notification Banner */}
        {savedNotification && (
          <div className="mb-6 flex items-center space-x-2.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2 text-xs text-[var(--oxblood)] shadow-xs animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-[var(--oxblood)]" />
            <span className="font-editorial-mono">
              Draft successfully saved to your local archive.
            </span>
          </div>
        )}

        {/* ===================================================================
            MANUSCRIPT CANVAS & TITLE FIELDS
            Self-explanatory, welcoming placeholders with clean typography
            =================================================================== */}
        <div className="mb-8 space-y-3">
          <input
            type="text"
            placeholder="Give your piece a title..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDirty(true);
            }}
            className="w-full bg-transparent font-editorial-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/40 focus:outline-hidden"
          />

          <input
            type="text"
            placeholder="Add a subtitle or short introduction..."
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              setIsDirty(true);
            }}
            className="w-full bg-transparent font-editorial-serif italic text-lg sm:text-xl text-[var(--ink-secondary)] placeholder-[var(--ink-muted)]/40 focus:outline-hidden"
          />
        </div>

        {/* ===================================================================
            PREVIEW MODE (READER INSPECTION) vs LIVE WRITING CANVAS
            =================================================================== */}
        {proofMode ? (
          <div className="book-jacket rounded-xl p-8 sm:p-12 mb-12 shadow-xs">
            <div className="mb-4 flex items-center justify-between font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] pb-3 border-b border-[var(--editorial-rule)]">
              <span>READER PREVIEW INSPECTION</span>
              <span>{publication}</span>
            </div>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-[var(--ink-primary)]">
              {title || "Untitled Document"}
            </h2>
            {excerpt && (
              <p className="mt-3 font-editorial-serif text-lg italic text-[var(--ink-secondary)]">
                {excerpt}
              </p>
            )}
            <div
              className="mt-8 font-editorial-serif text-lg leading-[1.88] text-[var(--ink-primary)] space-y-4"
              dangerouslySetInnerHTML={{
                __html: contentHtml || "<p class='italic text-[var(--ink-muted)]'>No prose inscribed yet.</p>",
              }}
            />
          </div>
        ) : (
          <div className="mb-12">
            <Editor
              initialContent={contentHtml}
              onChange={({ html, text }) => {
                setContentHtml(html);
                const count = text.trim().split(/\s+/).filter(Boolean).length;
                setWords(count);
                setIsDirty(true);
              }}
            />
          </div>
        )}

        {/* Editorial Craftsmanship Guidance */}
        {!focusMode && (
          <div className="book-jacket rounded-xl p-6 sm:p-8">
            <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] mb-2 font-bold">
              <Feather className="h-3.5 w-3.5" />
              <span>Editorial Composition Precepts</span>
            </div>
            <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] leading-relaxed">
              Every sentence inscribed in INKFORGE is preserved local-first. When published, your manuscript adapts seamlessly into long-form digital folios, ambient reading modes, and print-ready editions. Write with permanence.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--paper-canvas)] flex items-center justify-center">
          <div className="font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] animate-pulse">
            Loading Manuscript Studio...
          </div>
        </div>
      }
    >
      <WritePageContent />
    </Suspense>
  );
}

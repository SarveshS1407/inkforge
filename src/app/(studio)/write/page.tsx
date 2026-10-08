"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { Editor } from "@/components/editor/Editor";
import { getBookById, saveBook } from "@/lib/book-store";
import { BookIdentity } from "@/types/book";
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
  const [savedNotification, setSavedNotification] = useState(false);
  const [words, setWords] = useState(0);
  const [proofMode, setProofMode] = useState(false);

  const TARGET_WORDS = 1200;

  useEffect(() => {
    if (bookId) {
      const book = getBookById(bookId);
      if (book) {
        setActiveBook(book);
        setTitle(book.title);
        setExcerpt(book.description);
        setPublication(book.genre);
        return;
      }
    }

    const savedDraft = localStorage.getItem("inkforge_active_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.excerpt) setExcerpt(parsed.excerpt);
        if (parsed.contentHtml) setContentHtml(parsed.contentHtml);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.publication) setPublication(parsed.publication);
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
  }, [bookId]);

  const handleSave = async (targetStatus = status) => {
    setIsSaving(true);
    const draftData = {
      title: title || "Untitled Manuscript",
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
      const postSlug = (title || "untitled-manuscript")
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
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2500);
    }, 280);
  };

  const calculateRhythm = () => {
    if (words === 0) return "BLANK LEAF";
    if (words < 300) return "EPIGRAM / SKETCH";
    if (words < 800) return "CRITICAL ESSAY";
    if (words < 1800) return "TREATISE";
    return "EXTENDED MONOGRAPH";
  };

  const progressPct = Math.min(100, Math.round((words / TARGET_WORDS) * 100));

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Active Book Identity Banner if present */}
        {activeBook && (
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

        {/* The Scribe Master Desk Header */}
        <div className="mb-8 flex flex-col gap-4 border-b border-[var(--editorial-rule)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)]">
              <span className="font-bold">The Scribe&apos;s Studio Desk</span>
              <span className="text-[var(--editorial-rule)]">•</span>
              <span className="text-[var(--ink-muted)]">Folio IF-SCRIBE-2026</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-editorial-mono text-[var(--ink-muted)]">
              <span>RHYTHM: <strong className="text-[var(--ink-primary)]">{calculateRhythm()}</strong></span>
              <span>•</span>
              <span>{Math.max(1, Math.ceil(words / 220))} MIN READ</span>
              <span>•</span>
              <span>~{(words / 320).toFixed(1)} PRINT PAGES</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[var(--amber-gold)]">
                <Target className="h-3 w-3" />
                <span>{progressPct}% OF {TARGET_WORDS}W TARGET</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Galley Proof Preview Toggle */}
            <button
              type="button"
              onClick={() => setProofMode(!proofMode)}
              className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 font-editorial-mono text-xs transition-colors shadow-xs ${
                proofMode
                  ? "bg-[var(--oxblood)] text-white font-bold"
                  : "bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--paper-border)] hover:border-[var(--oxblood)]"
              }`}
              title="Toggle Galley Proof Reader Preview"
            >
              {proofMode ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{proofMode ? "Return to Scribe" : "Galley Proof"}</span>
            </button>

            {/* Publication Selector */}
            <select
              value={publication}
              onChange={(e) => setPublication(e.target.value)}
              className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1.5 font-editorial-sans text-xs text-[var(--ink-primary)] shadow-xs focus:border-[var(--oxblood)] focus:outline-none"
            >
              <option value="Architecture & Craft">Architecture &amp; Craft</option>
              <option value="Digital Ecology">Digital Ecology</option>
              <option value="Inkforge Engineering">Inkforge Engineering</option>
              <option value="Literary Review">The Literary Review</option>
            </select>

            {/* Lifecycle Status Selector */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1.5 font-editorial-sans text-xs text-[var(--ink-primary)] shadow-xs focus:border-[var(--oxblood)] focus:outline-none"
            >
              <option value="DRAFT">Draft Manuscript</option>
              <option value="IN_REVIEW">Submit for Peer Review</option>
              <option value="SCHEDULED">Schedule Edition</option>
              <option value="PUBLISHED">Published Edition</option>
            </select>

            {status === "SCHEDULED" && (
              <div className="flex items-center space-x-1 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2 py-1 text-xs shadow-xs">
                <Calendar className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-transparent text-xs text-[var(--ink-primary)] focus:outline-none font-editorial-mono"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => handleSave(status)}
              disabled={isSaving}
              className="flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-1.5 font-editorial-sans text-xs font-medium text-[var(--ink-primary)] shadow-xs transition-colors hover:border-[var(--oxblood)] disabled:opacity-50 active:scale-[0.98]"
            >
              <Save className="h-3.5 w-3.5 text-[var(--oxblood)]" />
              <span>{isSaving ? "Inking..." : "Save Manuscript"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatus("PUBLISHED");
                handleSave("PUBLISHED");
              }}
              className="flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-1.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-sm active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Publish Edition</span>
            </button>
          </div>
        </div>

        {savedNotification && (
          <div className="mb-6 flex items-center space-x-2 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2.5 text-xs text-[var(--oxblood)] animate-in fade-in shadow-xs">
            <CheckCircle2 className="h-4 w-4 text-[var(--oxblood)]" />
            <span className="font-editorial-mono">Manuscript faithfully inscribed to the local archive sanctuary.</span>
          </div>
        )}

        {/* Title & Subtitle */}
        <div className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="Title of this Monograph..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent font-editorial-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/50 focus:outline-none"
          />

          <input
            type="text"
            placeholder="Add an italicized prologue, subtitle, or summary excerpt..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full bg-transparent font-editorial-serif italic text-lg sm:text-xl text-[var(--ink-secondary)] placeholder-[var(--ink-muted)]/40 focus:outline-none"
          />
        </div>

        {/* Galley Proof Mode vs Live Editor */}
        {proofMode ? (
          <div className="book-jacket rounded-xl p-8 sm:p-12 mb-12">
            <div className="mb-4 flex items-center justify-between font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] pb-3 border-b border-[var(--editorial-rule)]">
              <span>GALLEY PROOF INSPECTION</span>
              <span>{publication}</span>
            </div>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-[var(--ink-primary)]">
              {title || "Untitled Monograph"}
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
              }}
            />
          </div>
        )}

        {/* Editorial Craft Precepts */}
        <div className="book-jacket rounded-xl p-6 sm:p-8">
          <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] mb-2 font-bold">
            <Feather className="h-3.5 w-3.5" />
            <span>Master Bookbinder&apos;s Precepts</span>
          </div>
          <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] leading-relaxed">
            Every sentence inscribed here is structured as an immutable document tree. When published, this manuscript seamlessly adapts into web reading surfaces, e-ink folios, and print-ready editions. Write with permanence.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
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


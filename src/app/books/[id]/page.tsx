"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { PhysicalBook } from "@/components/landing/PhysicalBook";
import { getBookById, saveBook, addCoverVersion } from "@/lib/book-store";
import { BookIdentity, CoverVersion } from "@/types/book";
import { coverService } from "@/lib/cover-generator/service";
import {
  BookOpen,
  PenTool,
  Compass,
  ArrowLeft,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
  Bookmark,
  Calendar,
  Clock,
} from "lucide-react";

export default function BookWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const bookId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [book, setBook] = useState<BookIdentity | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"book" | "flat">("book");
  const [activePanel, setActivePanel] = useState<"outline" | "notes" | "cover" | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (bookId) {
      const found = getBookById(bookId);
      if (found) {
        setBook(found);
      }
    }
  }, [bookId]);

  if (!book) {
    return (
      <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
          <BookOpen className="h-10 w-10 text-[var(--oxblood)] mx-auto opacity-60" />
          <h2 className="font-editorial-serif text-2xl font-bold">Volume Not Found</h2>
          <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)]">
            This manuscript does not exist or has been archived.
          </p>
          <div className="pt-4">
            <Link
              href="/posts"
              className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-2 text-xs font-editorial-sans uppercase tracking-wider text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Editorial Ledger</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const activeCover =
    book.cover.versions.find((v) => v.id === book.cover.currentVersionId) ||
    book.cover.versions[0] ||
    null;

  const handleMenuAction = (key: string) => {
    switch (key) {
      case "write":
        router.push(`/write?bookId=${book.id}`);
        break;
      case "outline":
      case "chapters":
        setActivePanel("outline");
        break;
      case "notes":
        setActivePanel("notes");
        break;
      case "cover":
        setActivePanel("cover");
        break;
      case "read":
      case "preview":
        router.push(`/read/${book.slug}`);
        break;
      default:
        break;
    }
  };

  const handleRegenerateCover = async () => {
    setIsRegenerating(true);
    try {
      const result = await coverService.generateCover({
        title: book.title,
        subtitle: book.subtitle,
        author: book.author,
        description: book.description,
        genre: book.genre,
        mood: book.mood,
        keywords: book.keywords,
        direction: book.coverDirection,
      });

      const newVersion = coverService.createCoverVersion(result, book.cover.versions.length + 1);
      const updated = addCoverVersion(book.id, newVersion);
      if (updated) setBook(updated);
    } catch (err) {
      console.error("Cover regeneration failed", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      {/* Workspace Sub-Header */}
      <section className="border-b border-[var(--editorial-rule)] bg-[var(--paper-surface)]/60 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between font-editorial-mono text-[10px] tracking-wider uppercase text-[var(--ink-muted)]">
          <div className="flex items-center space-x-3">
            <Link
              href="/posts"
              className="inline-flex items-center space-x-1 hover:text-[var(--oxblood)] transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Catalog</span>
            </Link>
            <span>•</span>
            <span className="font-bold text-[var(--oxblood)]">{book.genre}</span>
            <span>•</span>
            <span className="hidden sm:inline line-clamp-1">{book.title}</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 rounded border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-0.5">
              <button
                onClick={() => setViewMode("book")}
                className={`px-2 py-0.5 rounded text-[9px] uppercase ${
                  viewMode === "book" ? "bg-[var(--oxblood)] text-white font-bold" : "hover:text-[var(--ink-primary)]"
                }`}
              >
                3D Book
              </button>
              <button
                onClick={() => setViewMode("flat")}
                className={`px-2 py-0.5 rounded text-[9px] uppercase ${
                  viewMode === "flat" ? "bg-[var(--oxblood)] text-white font-bold" : "hover:text-[var(--ink-primary)]"
                }`}
              >
                Flat Plate
              </button>
            </div>

            <Link
              href={`/write?bookId=${book.id}`}
              className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-3 py-1 font-editorial-sans text-[11px] font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all"
            >
              <PenTool className="h-3 w-3" />
              <span>Write Manuscript</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Workspace Stage */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {viewMode === "book" ? (
          <div className="flex flex-col items-center">
            <div className="w-full flex justify-center py-4">
              <PhysicalBook
                isOpen={isOpen}
                onOpen={() => setIsOpen(true)}
                onClose={() => setIsOpen(false)}
                book={book}
                activeVersion={activeCover}
                onMenuAction={handleMenuAction}
              />
            </div>

            <div className="mt-4 font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] text-center">
              {isOpen ? "Click 'Close Cover' or Esc to fold volume" : "Click book cover or press Enter to unfold workspace spread"}
            </div>
          </div>
        ) : (
          /* Flat Cover Plate View */
          <div className="flex flex-col items-center py-8">
            <div className="relative w-full max-w-md aspect-[3/4] rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-10 shadow-2xl overflow-hidden flex flex-col justify-between text-center select-none">
              {activeCover?.imageUrl && (
                <>
                  <img
                    src={activeCover.imageUrl}
                    alt={book.title}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 pointer-events-none" />
                </>
              )}

              <div className="absolute inset-6 border border-white/20 rounded-lg pointer-events-none" />

              <div className="relative z-10 space-y-1">
                <div className="font-editorial-mono text-xs uppercase tracking-[0.3em] text-[var(--amber-gold)] font-bold">
                  {book.genre}
                </div>
                <div className="font-editorial-mono text-[9px] uppercase tracking-wider text-white/70">
                  By {book.author}
                </div>
              </div>

              <div className="relative z-10 my-auto py-6 space-y-3">
                <span className="font-editorial-serif text-2xl text-[var(--amber-gold)]">❦</span>
                <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="font-editorial-serif italic text-sm text-white/80 line-clamp-2">
                    {book.subtitle}
                  </p>
                )}
              </div>

              <div className="relative z-10 pt-3 border-t border-white/20 font-editorial-mono text-[9px] uppercase tracking-widest text-white/60">
                Inkforge Bound Edition • Continuous Press
              </div>
            </div>

            {/* Flat View Actions */}
            <div className="mt-6 flex items-center space-x-3">
              <button
                onClick={handleRegenerateCover}
                disabled={isRegenerating}
                className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                <span>Regenerate Plate</span>
              </button>

              <button
                onClick={() => setViewMode("book")}
                className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Return to 3D Book</span>
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL OVERLAYS (Outline, Notes, Cover Archive)
            ===================================================================== */}
        {activePanel === "outline" && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setActivePanel(null)}
          >
            <div
              className="relative w-full max-w-xl rounded-xl border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-6 sm:p-8 text-[var(--ink-primary)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3">
                <div className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold">
                  Chapter Folios &amp; Outline
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="text-xs uppercase font-editorial-mono hover:text-[var(--oxblood)]"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 divide-y divide-[var(--editorial-rule)]">
                {book.chapters.map((ch) => (
                  <div key={ch.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-editorial-serif text-base font-bold text-[var(--ink-primary)]">
                        {ch.title}
                      </h4>
                      <p className="font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                        Status: {ch.status} • {ch.wordCount} words
                      </p>
                    </div>

                    <Link
                      href={`/write?bookId=${book.id}`}
                      className="font-editorial-sans text-xs uppercase tracking-wider text-[var(--oxblood)] font-semibold hover:underline"
                    >
                      Inscribe →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePanel === "notes" && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setActivePanel(null)}
          >
            <div
              className="relative w-full max-w-xl rounded-xl border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-6 sm:p-8 text-[var(--ink-primary)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3">
                <div className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold">
                  Story Bible &amp; Marginalia
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="text-xs uppercase font-editorial-mono hover:text-[var(--oxblood)]"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3 font-editorial-serif text-sm text-[var(--ink-secondary)]">
                <div className="p-3 rounded bg-[var(--paper-surface)] border border-[var(--paper-border)]">
                  <h5 className="font-bold text-[var(--ink-primary)] mb-1">Visual Themes</h5>
                  <p>{book.visualThemes.join(" • ")}</p>
                </div>
                <div className="p-3 rounded bg-[var(--paper-surface)] border border-[var(--paper-border)]">
                  <h5 className="font-bold text-[var(--ink-primary)] mb-1">Premise Synopsis</h5>
                  <p>{book.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePanel === "cover" && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setActivePanel(null)}
          >
            <div
              className="relative w-full max-w-2xl rounded-xl border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-6 sm:p-8 text-[var(--ink-primary)] shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3">
                <div className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold">
                  Cover Archive &amp; Versions
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="text-xs uppercase font-editorial-mono hover:text-[var(--oxblood)]"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)]">
                    All generated versions are preserved. Select which version is active.
                  </p>
                  <button
                    onClick={handleRegenerateCover}
                    disabled={isRegenerating}
                    className="inline-flex items-center space-x-1 text-xs font-editorial-mono text-[var(--oxblood)] hover:underline"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Generate New Version</span>
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {book.cover.versions.map((ver) => (
                    <div
                      key={ver.id}
                      className={`p-3 rounded-lg border transition-all ${
                        book.cover.currentVersionId === ver.id
                          ? "border-[var(--oxblood)] bg-[var(--paper-warm)] shadow-xs"
                          : "border-[var(--paper-border)] bg-[var(--paper-surface)]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-editorial-mono mb-2">
                        <span className="font-bold">Version {ver.versionNumber}</span>
                        <span className="text-[10px] text-[var(--ink-muted)]">{ver.directionId}</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = {
                            ...book,
                            cover: { ...book.cover, currentVersionId: ver.id },
                          };
                          saveBook(updated);
                          setBook(updated);
                        }}
                        className={`w-full py-1 rounded text-[10px] uppercase font-editorial-mono ${
                          book.cover.currentVersionId === ver.id
                            ? "bg-[var(--oxblood)] text-white font-bold"
                            : "bg-[var(--paper-canvas)] text-[var(--ink-primary)] hover:border-[var(--oxblood)] border border-[var(--paper-border)]"
                        }`}
                      >
                        {book.cover.currentVersionId === ver.id ? "Active Cover" : "Make Active"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

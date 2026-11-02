"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { PhysicalBook } from "@/components/landing/PhysicalBook";
import { SafeContentRenderer } from "@/components/content/SafeContentRenderer";
import { BookHistoryModal } from "@/components/books/BookHistoryModal";
import { AddToCollectionModal } from "@/components/collections/AddToCollectionModal";
import { getBookById } from "@/lib/book-store";
import { BookIdentity, CoverVersion } from "@/types/book";
import {
  BookOpen,
  PenTool,
  ArrowLeft,
  ArrowRight,
  Clock,
  Share2,
  Check,
  Bookmark,
  BookmarkCheck,
  History,
  Eye,
  Globe,
  Lock,
  CheckCircle2,
  ListOrdered,
  Menu,
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
  Type,
  Sparkles,
  Layers,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ChapterItem {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  orderIndex?: number | null;
  contentHtml?: string | null;
  contentJson?: any;
  readingTimeMinutes?: number | null;
  wordCount?: number | null;
  status?: string;
}

interface LoadedBook {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  description?: string | null;
  genre?: string | null;
  mood?: string | null;
  coverTheme?: string | null;
  coverTitle?: string | null;
  coverSubtitle?: string | null;
  coverAuthor?: string | null;
  coverEmblem?: string | null;
  status: string;
  visibility: string;
  sourceFilename?: string | null;
  importMethod?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
  };
  chapters: ChapterItem[];
}

export default function BookContinuousReaderPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [book, setBook] = useState<LoadedBook | null>(null);
  const [legacyBook, setLegacyBook] = useState<BookIdentity | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View & Reading Preferences
  const [viewMode, setViewMode] = useState<"continuous" | "folio">("continuous");
  const [fontSize, setFontSize] = useState<"standard" | "large" | "generous">("standard");
  const [solitaryMode, setSolitaryMode] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);

  // Modals & User Actions
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // 3D Book State
  const [is3DOpen, setIs3DOpen] = useState(false);

  // Load Book and User
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    async function loadData() {
      // 1. Identify active authenticated user
      try {
        const meRes = await fetch("/api/v1/auth/me");
        if (meRes.ok) {
          const meJson = await meRes.json();
          if (mounted && meJson.success && meJson.data) {
            setCurrentUserId(meJson.data.id);
          }
        }
      } catch {
        // Unauthenticated visitor
      }

      // 2. Fetch Book from Database API
      try {
        const res = await fetch(`/api/v1/books/${rawId}`);
        if (res.ok) {
          const json = await res.json();
          if (mounted && json.success && json.data) {
            setBook(json.data);
            setIsLoading(false);
            return;
          }
        } else if (res.status === 403) {
          if (mounted) {
            setErrorMessage("This volume is private and accessible only to its author.");
            setIsLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn("Could not fetch book from primary DB API, attempting fallbacks:", err);
      }

      // 3. Fallback: Try by slug API
      try {
        const sRes = await fetch(`/api/v1/books/by-slug/${rawId}`);
        if (sRes.ok) {
          const sJson = await sRes.json();
          if (mounted && sJson.success && sJson.data) {
            setBook(sJson.data);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Continue
      }

      // 4. Fallback: Legacy local storage store
      try {
        const legacy = getBookById(rawId);
        if (legacy && mounted) {
          setLegacyBook(legacy);
          // Convert to LoadedBook shape
          const chapters: ChapterItem[] = (legacy.chapters || []).map((ch, idx) => ({
            id: ch.id,
            title: ch.title,
            slug: `chapter-${idx + 1}`,
            orderIndex: idx + 1,
            contentHtml: `<p>${(ch as any).summary || "Draft chapter inscribed in local atelier."}</p>`,
            wordCount: ch.wordCount || 850,
            readingTimeMinutes: Math.max(1, Math.round((ch.wordCount || 850) / 220)),
          }));

          setBook({
            id: legacy.id,
            title: legacy.title,
            subtitle: legacy.subtitle,
            slug: legacy.slug,
            description: legacy.description,
            genre: legacy.genre,
            mood: legacy.mood,
            coverTheme: (legacy as any).coverTheme,
            status: "DRAFT",
            visibility: "PRIVATE",
            createdAt: legacy.createdAt,
            updatedAt: legacy.updatedAt,
            authorId: "local-user",
            author: {
              id: "local-user",
              username: legacy.author.toLowerCase().replace(/\s+/g, ""),
              displayName: legacy.author,
            },
            chapters,
          });
          setIsLoading(false);
          return;
        }
      } catch {
        // Fallback finished
      }

      if (mounted) {
        setErrorMessage("This literary volume does not exist or has been removed from circulation.");
        setIsLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [rawId]);

  // Track Scroll Progress & Active Chapter
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }

      // Detect active chapter
      if (book && book.chapters.length > 0) {
        const scrollPosition = window.scrollY + 200;
        for (let i = book.chapters.length - 1; i >= 0; i--) {
          const el = document.getElementById(`chapter-section-${i}`);
          if (el && el.offsetTop <= scrollPosition) {
            setActiveChapterIndex(i);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [book]);

  // Check bookmarks
  useEffect(() => {
    try {
      const marks = JSON.parse(localStorage.getItem("inkforge_book_bookmarks") || "[]");
      setIsBookmarked(marks.includes(rawId));
    } catch {
      // Ignored
    }
  }, [rawId]);

  const toggleBookmark = () => {
    try {
      const marks = JSON.parse(localStorage.getItem("inkforge_book_bookmarks") || "[]");
      let next: string[];
      if (marks.includes(rawId)) {
        next = marks.filter((m: string) => m !== rawId);
        setIsBookmarked(false);
      } else {
        next = [...marks, rawId];
        setIsBookmarked(true);
      }
      localStorage.setItem("inkforge_book_bookmarks", JSON.stringify(next));
    } catch {
      // Ignored
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setStatusNotice("Public volume link copied to clipboard.");
      setTimeout(() => {
        setCopiedLink(false);
        setStatusNotice(null);
      }, 4000);
    }
  };

  const handleTogglePublish = async () => {
    if (!book) return;
    setIsPublishing(true);
    const isCurrentlyPublished = book.visibility === "PUBLIC" && book.status === "PUBLISHED";
    const endpoint = isCurrentlyPublished
      ? `/api/v1/books/${book.id}/unpublish`
      : `/api/v1/books/${book.id}/publish`;

    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update publication status.");
      }

      setBook((prev) =>
        prev
          ? {
              ...prev,
              visibility: isCurrentlyPublished ? "PRIVATE" : "PUBLIC",
              status: isCurrentlyPublished ? "DRAFT" : "PUBLISHED",
              publishedAt: isCurrentlyPublished ? null : new Date().toISOString(),
            }
          : null
      );

      setStatusNotice(
        isCurrentlyPublished
          ? "Volume unpublished and restored to Private status."
          : "Volume successfully published to the Public Archive!"
      );
      setTimeout(() => setStatusNotice(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Publication action failed.");
    } finally {
      setIsPublishing(false);
    }
  };

  const scrollToChapter = (index: number) => {
    const el = document.getElementById(`chapter-section-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveChapterIndex(index);
      setTocOpen(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-28 text-center space-y-4">
          <Loader2 className="h-8 w-8 text-[var(--oxblood)] animate-spin mx-auto" />
          <h2 className="font-editorial-serif text-xl font-bold">Unbinding Volume from Archive...</h2>
          <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)]">
            Retrieving ordered chapters and typographic leaves.
          </p>
        </main>
      </div>
    );
  }

  // Error / Not Found State
  if (errorMessage || !book) {
    return (
      <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-24 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--oxblood-subtle)] border border-[var(--oxblood)]/30">
            <Lock className="h-6 w-6 text-[var(--oxblood)]" />
          </div>
          <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
            Volume Restricted or Archived
          </h2>
          <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] max-w-md mx-auto">
            {errorMessage || "This manuscript could not be found in the registry."}
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              href="/posts"
              className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-2 text-xs font-editorial-sans uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Ledger</span>
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2 text-xs font-editorial-sans uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-all"
            >
              <span>Explore Public Works</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isAuthor = currentUserId === book.authorId || (legacyBook && currentUserId === null);
  const isPublic = book.visibility === "PUBLIC" && book.status === "PUBLISHED";
  const totalWords = book.chapters.reduce((acc, ch) => acc + (ch.wordCount || 0), 0);
  const totalMinutes = Math.max(1, Math.round(totalWords / 220));

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)] flex flex-col selection:bg-[var(--oxblood)] selection:text-white">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[var(--paper-border)]">
        <div
          className="h-full bg-[var(--oxblood)] transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <Header />

      {/* Sub-Header Reading Ribbon */}
      <nav
        aria-label="Reading controls"
        className="sticky top-0 z-40 border-b border-[var(--editorial-rule)] bg-[var(--paper-canvas)]/95 backdrop-blur-md px-4 py-2.5 transition-all shadow-2xs"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs font-editorial-mono">
          {/* Back & Breadcrumb */}
          <div className="flex items-center space-x-3 overflow-hidden">
            <Link
              href="/posts"
              className="inline-flex items-center space-x-1 text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors shrink-0"
              title="Return to Editorial Ledger"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline uppercase text-[10px] tracking-wider">Ledger</span>
            </Link>
            <span className="text-[var(--editorial-rule)] hidden sm:inline">•</span>
            <div className="flex items-center space-x-1.5 overflow-hidden">
              <span className="font-bold text-[var(--oxblood)] uppercase text-[10px] shrink-0">
                {book.genre || "Volume"}
              </span>
              <span className="text-[var(--ink-muted)] hidden md:inline">/</span>
              <span className="truncate text-[11px] font-editorial-serif font-bold text-[var(--ink-primary)] hidden md:inline">
                {book.title}
              </span>
            </div>
          </div>

          {/* Controls Cluster */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* View Mode Toggle: Continuous vs 3D Folio */}
            <div className="flex items-center rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("continuous")}
                className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === "continuous"
                    ? "bg-[var(--oxblood)] text-white font-bold"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
                title="Continuous vertical reading of all chapters"
              >
                Continuous
              </button>
              <button
                type="button"
                onClick={() => setViewMode("folio")}
                className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === "folio"
                    ? "bg-[var(--oxblood)] text-white font-bold"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
                title="Inspect 3D Bound Volume & Folio Spread"
              >
                3D Folio
              </button>
            </div>

            {/* Table of Contents Drawer Toggle */}
            {book.chapters.length > 0 && (
              <button
                type="button"
                onClick={() => setTocOpen(!tocOpen)}
                className={`inline-flex items-center space-x-1 rounded border px-2 py-1 text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                  tocOpen
                    ? "border-[var(--oxblood)] bg-[var(--oxblood-subtle)] text-[var(--oxblood)] font-bold"
                    : "border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
                title="Table of Contents & Chapters"
              >
                <ListOrdered className="h-3 w-3" />
                <span className="hidden sm:inline">Contents ({book.chapters.length})</span>
              </button>
            )}

            {/* Font Size Selector */}
            <div className="hidden lg:flex items-center rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] p-0.5">
              {(["standard", "large", "generous"] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSize(sz)}
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold cursor-pointer ${
                    fontSize === sz ? "bg-[var(--oxblood)] text-white" : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  }`}
                  title={`Typography: ${sz}`}
                >
                  {sz === "standard" ? "A" : sz === "large" ? "A+" : "A++"}
                </button>
              ))}
            </div>

            {/* Solitary Mode Toggle */}
            <button
              type="button"
              onClick={() => setSolitaryMode(!solitaryMode)}
              className={`hidden sm:inline-flex items-center rounded border px-2 py-1 text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                solitaryMode
                  ? "border-[var(--oxblood)] bg-[var(--oxblood)] text-white"
                  : "border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              }`}
              title={solitaryMode ? "Exit Solitary Focus" : "Enter Solitary Focus"}
            >
              {solitaryMode ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </button>

            {/* Share & Bookmark */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] p-1 text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors cursor-pointer"
              title="Copy volume canonical link"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={toggleBookmark}
              className={`rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] p-1 transition-colors cursor-pointer ${
                isBookmarked ? "text-[var(--oxblood)]" : "text-[var(--ink-muted)] hover:text-[var(--oxblood)]"
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Volume"}
            >
              {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 fill-current" /> : <Bookmark className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Floating Status Notice Toast */}
      {statusNotice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 p-3 text-xs text-emerald-800 dark:text-emerald-200 shadow-lg flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Slide-Over Table of Contents Drawer */}
      {tocOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="h-full w-full max-w-md bg-[var(--paper-surface)] border-l border-[var(--paper-border)] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-4">
                <div className="flex items-center space-x-2">
                  <ListOrdered className="h-4 w-4 text-[var(--oxblood)]" />
                  <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                    Table of Contents
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTocOpen(false)}
                  className="rounded p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 text-xs font-editorial-mono text-[var(--ink-secondary)]">
                {book.chapters.length} chapter(s) · {totalWords.toLocaleString()} words · ~{totalMinutes} min reading time
              </div>

              <div className="mt-6 space-y-2">
                {book.chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => scrollToChapter(idx)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      activeChapterIndex === idx
                        ? "border-[var(--oxblood)] bg-[var(--oxblood-subtle)] text-[var(--oxblood)] font-bold shadow-xs"
                        : "border-[var(--paper-border)] hover:border-[var(--oxblood)]/50 bg-[var(--paper-canvas)] text-[var(--ink-primary)]"
                    }`}
                  >
                    <div>
                      <div className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                        Chapter {idx + 1}
                      </div>
                      <div className="font-editorial-serif text-sm font-semibold mt-0.5 line-clamp-1">
                        {ch.title}
                      </div>
                      {ch.subtitle && (
                        <div className="font-editorial-serif italic text-xs text-[var(--ink-secondary)] line-clamp-1">
                          {ch.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="font-editorial-mono text-[10px] text-[var(--ink-muted)] shrink-0 ml-3">
                      {ch.wordCount ? `${ch.wordCount} words` : `${ch.readingTimeMinutes || 3} min`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {isAuthor && (
              <div className="mt-8 pt-4 border-t border-[var(--editorial-rule)] space-y-2">
                <Link
                  href={`/write?bookId=${book.id}`}
                  className="w-full inline-flex items-center justify-center space-x-1.5 rounded-md bg-[var(--oxblood)] py-2 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all"
                >
                  <PenTool className="h-3.5 w-3.5" />
                  <span>Inscribe Next Chapter</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN VIEW AREA */}
      {viewMode === "folio" ? (
        /* 3D Interactive Folio Spread Mode */
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 flex-1 flex flex-col items-center justify-center">
          <div className="w-full flex justify-center py-6">
            <PhysicalBook
              isOpen={is3DOpen}
              onOpen={() => setIs3DOpen(true)}
              onClose={() => setIs3DOpen(false)}
              book={{
                id: book.id,
                title: book.title,
                subtitle: book.subtitle || undefined,
                author: book.author.displayName || book.author.username,
                description: book.description || "",
                genre: book.genre || "Literary Volume",
                mood: book.mood || "Contemplative",
                coverDirection: "editorial",
                cover: {
                  currentVersionId: "v1",
                  versions: [
                    {
                      id: "v1",
                      versionNumber: 1,
                      directionId: "editorial",
                      palette: {
                        clothColor: "#1F1610",
                        accentColor: "#8A2B18",
                        foilColor: "#D4AF37",
                        paperTone: "cotton",
                        textColor: "#F7F2E7",
                      },
                      typography: {
                        titleFont: "serif",
                        bodyFont: "serif",
                      },
                      artworkSource: "curated",
                      createdAt: book.createdAt,
                    },
                  ],
                },
                slug: book.slug,
                createdAt: book.createdAt,
                updatedAt: book.updatedAt,
                state: "READY_TO_PUBLISH",
              } as unknown as BookIdentity}
              activeVersion={null}
              onMenuAction={(key) => {
                if (key === "read") setViewMode("continuous");
                if (key === "write") router.push(`/write?bookId=${book.id}`);
                if (key === "chapters") setTocOpen(true);
              }}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode("continuous")}
              className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-2 text-xs font-editorial-sans uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Read Continuously</span>
            </button>
            {isAuthor && (
              <Link
                href={`/write?bookId=${book.id}`}
                className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2 text-xs font-editorial-sans uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-all"
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>Write in Studio</span>
              </Link>
            )}
          </div>
        </main>
      ) : (
        /* Continuous Vertical Reading Canvas */
        <main className="flex-1 mx-auto max-w-5xl px-4 py-8 sm:px-6 w-full flex flex-col lg:flex-row gap-8">
          {/* Left Table of Contents Sidebar (Desktop Sticky) */}
          {!solitaryMode && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-16 space-y-6">
                <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3 font-editorial-mono text-xs font-bold uppercase tracking-wider text-[var(--oxblood)]">
                    <span>Folio Contents</span>
                    <span className="text-[10px] text-[var(--ink-muted)]">{book.chapters.length} Parts</span>
                  </div>

                  <div className="mt-3 space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                    {book.chapters.map((ch, idx) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => scrollToChapter(idx)}
                        className={`w-full text-left px-2.5 py-2 rounded text-xs transition-all cursor-pointer ${
                          activeChapterIndex === idx
                            ? "bg-[var(--oxblood-subtle)] text-[var(--oxblood)] font-bold border-l-2 border-[var(--oxblood)]"
                            : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)]"
                        }`}
                      >
                        <div className="font-editorial-mono text-[9px] uppercase tracking-wider opacity-70">
                          Part {idx + 1}
                        </div>
                        <div className="font-editorial-serif line-clamp-1">{ch.title}</div>
                      </button>
                    ))}
                  </div>

                  {isAuthor && (
                    <div className="mt-4 pt-3 border-t border-[var(--editorial-rule)] space-y-1.5">
                      <Link
                        href={`/write?bookId=${book.id}`}
                        className="w-full inline-flex items-center justify-center space-x-1.5 rounded bg-[var(--oxblood)] py-1.5 text-[11px] font-editorial-sans uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] transition-all"
                      >
                        <PenTool className="h-3 w-3" />
                        <span>Inscribe Chapter</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setHistoryModalOpen(true)}
                        className="w-full inline-flex items-center justify-center space-x-1.5 rounded border border-[var(--paper-border)] bg-[var(--paper-canvas)] py-1.5 text-[11px] font-editorial-mono text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-all cursor-pointer"
                      >
                        <History className="h-3 w-3" />
                        <span>Revision History</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Author Card */}
                <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 shadow-2xs">
                  <div className="font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-2">
                    Author Scribe
                  </div>
                  <Link
                    href={`/authors/${book.author.username}`}
                    className="group block font-editorial-serif text-sm font-bold text-[var(--ink-primary)] hover:text-[var(--oxblood)] transition-colors"
                  >
                    {book.author.displayName || book.author.username}
                  </Link>
                  <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)] mt-1">
                    @{book.author.username}
                  </p>
                  {book.author.bio && (
                    <p className="mt-2 text-xs font-editorial-serif text-[var(--ink-secondary)] line-clamp-3">
                      {book.author.bio}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* Center Prose Canvas */}
          <article className="flex-1 max-w-3xl mx-auto space-y-16">
            {/* Frontispiece / Title Page */}
            <header className="border-b-2 border-[var(--editorial-rule)] pb-12 pt-4 text-center space-y-5">
              {/* Privacy Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-editorial-mono text-[10px] uppercase tracking-wider font-semibold border">
                {isPublic ? (
                  <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 border-emerald-300/60 bg-emerald-50 dark:bg-emerald-950/40">
                    <Globe className="h-3 w-3" />
                    Published Edition · Public Access
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-900 dark:text-amber-200 border-amber-300/60 bg-amber-50 dark:bg-amber-950/40">
                    <Lock className="h-3 w-3" />
                    Private Volume · Visible Only to Author
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <h1 className="font-editorial-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)] leading-tight">
                {book.title}
              </h1>

              {book.subtitle && (
                <p className="font-editorial-serif italic text-lg sm:text-xl text-[var(--ink-secondary)] max-w-xl mx-auto">
                  {book.subtitle}
                </p>
              )}

              {/* Author & Meta */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-editorial-mono text-[var(--ink-muted)]">
                <span>By {book.author.displayName || book.author.username}</span>
                <span>•</span>
                <span>{book.genre || "Volume"}</span>
                <span>•</span>
                <span>{book.chapters.length} Chapters</span>
                <span>•</span>
                <span>{totalWords.toLocaleString()} Words</span>
                <span>•</span>
                <span>~{totalMinutes} Min Read</span>
              </div>

              {book.description && (
                <div className="mt-6 max-w-xl mx-auto rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)]/60 p-4 font-editorial-serif text-sm italic text-[var(--ink-secondary)] leading-relaxed">
                  &ldquo;{book.description}&rdquo;
                </div>
              )}

              {/* Author Control Bar */}
              {isAuthor && (
                <div className="pt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleTogglePublish}
                    disabled={isPublishing}
                    className={`inline-flex items-center space-x-1.5 rounded-md px-3.5 py-1.5 text-xs font-editorial-sans uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer ${
                      isPublic
                        ? "border border-amber-300 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                        : "bg-[var(--oxblood)] text-white hover:bg-[var(--oxblood-hover)]"
                    }`}
                  >
                    {isPublishing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isPublic ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Globe className="h-3.5 w-3.5" />
                    )}
                    <span>{isPublic ? "Unpublish to Private" : "Publish to World"}</span>
                  </button>

                  <Link
                    href={`/write?bookId=${book.id}`}
                    className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-1.5 text-xs font-editorial-sans uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-all"
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    <span>Inscribe in Studio</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setHistoryModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-1.5 text-xs font-editorial-sans uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-all cursor-pointer"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Revisions &amp; History</span>
                  </button>
                </div>
              )}
            </header>

            {/* Continuous Chapters Stream */}
            {book.chapters.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--paper-border)] p-12 text-center space-y-3">
                <BookOpen className="h-8 w-8 text-[var(--oxblood)] opacity-50 mx-auto" />
                <h3 className="font-editorial-serif text-lg font-bold">Volume Awaiting First Chapter</h3>
                <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)]">
                  The spine is bound, but no prose leaves have been inscribed yet.
                </p>
                {isAuthor && (
                  <div className="pt-2">
                    <Link
                      href={`/write?bookId=${book.id}`}
                      className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-2 text-xs font-editorial-sans uppercase tracking-wider text-white"
                    >
                      <PenTool className="h-3.5 w-3.5" />
                      <span>Inscribe Chapter 1</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              book.chapters.map((chapter, idx) => (
                <section
                  key={chapter.id}
                  id={`chapter-section-${idx}`}
                  className="space-y-6 pt-8 scroll-mt-20 border-b border-[var(--editorial-rule)]/60 pb-16 last:border-b-0"
                >
                  {/* Chapter Ornamental Header */}
                  <div className="text-center space-y-2">
                    <div className="font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
                      Folio Part {idx + 1}
                    </div>
                    <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
                      {chapter.title}
                    </h2>
                    {chapter.subtitle && (
                      <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] max-w-lg mx-auto">
                        {chapter.subtitle}
                      </p>
                    )}
                    <div className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] pt-1">
                      {chapter.wordCount ? `${chapter.wordCount.toLocaleString()} words` : ""}{" "}
                      {chapter.readingTimeMinutes ? `· ~${chapter.readingTimeMinutes} min` : ""}
                    </div>
                  </div>

                  {/* Chapter Body Prose */}
                  <div
                    className={`font-editorial-serif leading-relaxed text-[var(--ink-primary)] transition-all ${
                      fontSize === "large"
                        ? "text-lg leading-loose"
                        : fontSize === "generous"
                        ? "text-xl leading-loose"
                        : "text-base leading-relaxed"
                    }`}
                  >
                    <SafeContentRenderer
                      contentHtml={chapter.contentHtml || undefined}
                      contentJson={chapter.contentJson || undefined}
                    />
                  </div>

                  {/* Chapter Post-script / Jump to next */}
                  <div className="pt-6 flex items-center justify-between font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] border-t border-[var(--editorial-rule)]/40">
                    <span>End of Part {idx + 1}</span>
                    {idx < book.chapters.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => scrollToChapter(idx + 1)}
                        className="inline-flex items-center space-x-1 text-[var(--oxblood)] font-bold hover:underline cursor-pointer"
                      >
                        <span>Continue to Part {idx + 2}</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-[var(--oxblood)] font-bold">Volume Concluded</span>
                    )}
                  </div>
                </section>
              ))
            )}

            {/* Book Colophon & Publication Notice */}
            <footer className="border-t-2 border-[var(--editorial-rule)] pt-8 pb-16 space-y-4 text-center font-editorial-serif">
              <div className="font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
                Colophon &amp; Registry
              </div>
              <p className="text-xs text-[var(--ink-secondary)] max-w-md mx-auto italic">
                This edition was composed using the Inkforge Bookcraft Engine. Bound into permanent typographic leaves with
                deterministic versioning and archival safety.
              </p>
              {book.sourceFilename && (
                <div className="font-editorial-mono text-[9px] text-[var(--ink-muted)]">
                  Manuscript source: {book.sourceFilename} ({book.importMethod || "Import"})
                </div>
              )}
            </footer>
          </article>
        </main>
      )}

      {/* Book Revision History Modal */}
      {historyModalOpen && (
        <BookHistoryModal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          bookId={book.id}
          bookTitle={book.title}
          onRestored={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Add To Collection Modal */}
      {collectionModalOpen && (
        <AddToCollectionModal
          isOpen={collectionModalOpen}
          onClose={() => setCollectionModalOpen(false)}
          postId={book.id}
          postTitle={book.title}
        />
      )}
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { BookCreateModal } from "@/components/books/BookCreateModal";
import { BookHistoryModal } from "@/components/books/BookHistoryModal";
import { ManuscriptImportWizard } from "@/components/books/ManuscriptImportWizard";
import { DraftManager } from "@/lib/drafts/draft-manager";
import {
  FileText,
  Clock,
  Calendar,
  Eye,
  Edit3,
  Plus,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  CloudUpload,
  Upload,
  Loader2,
  Trash2,
  AlertCircle,
  Share2,
  Lock,
  Globe,
  Send,
  Check,
  Copy,
  User,
  History,
  LayoutGrid,
  List,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: string;
}

interface ChapterItem {
  id: string;
  title: string;
  orderIndex?: number | null;
  wordCount?: number | null;
  readingTimeMinutes?: number | null;
}

interface BookItem {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  description?: string | null;
  genre?: string | null;
  mood?: string | null;
  coverTheme?: string | null;
  status: string;
  visibility: "PRIVATE" | "PUBLIC" | string;
  sourceFilename?: string | null;
  importMethod?: string | null;
  originalFileSize?: number | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: {
    id: string;
    username: string;
    displayName?: string | null;
  };
  chapters: ChapterItem[];
}

interface PostItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  status: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED";
  scheduledFor?: string | null;
  updatedAt: string;
  version?: number;
  isLocalOnly?: boolean;
  author: {
    name: string;
    role: string;
  };
}

export default function PostsDashboardPage() {
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED">("ALL");
  const [bookFilter, setBookFilter] = useState<"ALL" | "PRIVATE" | "PUBLIC">("ALL");
  const [bookViewMode, setBookViewMode] = useState<"grid" | "list">("grid");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [showStandaloneSection, setShowStandaloneSection] = useState(true);

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [historyModalTarget, setHistoryModalTarget] = useState<BookItem | null>(null);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    let isAuthenticated = false;

    // 0. Check authenticated user identity
    try {
      const meRes = await fetch("/api/v1/auth/me");
      if (meRes.ok) {
        const meJson = await meRes.json();
        if (meJson.success && meJson.data) {
          setCurrentUser(meJson.data);
          isAuthenticated = true;
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }

    // 1. Fetch Books from Database API
    try {
      const bRes = await fetch("/api/v1/books?limit=100");
      if (bRes.ok) {
        const bJson = await bRes.json();
        if (bJson.success && Array.isArray(bJson.data?.items)) {
          setBooks(bJson.data.items);
        }
      }
    } catch (e) {
      console.warn("Could not fetch books from API:", e);
    }

    // 2. Fetch server documents / posts
    let serverItems: PostItem[] = [];
    try {
      const res = await fetch("/api/v1/documents?limit=100");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          serverItems = json.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            slug: item.slug,
            excerpt: item.excerpt,
            status: item.status,
            scheduledFor: item.scheduledFor,
            updatedAt: item.updatedAt,
            version: item.version,
            isLocalOnly: false,
            author: {
              name: item.author?.displayName || item.author?.username || "Resident Author",
              role: "Registered Author",
            },
          }));
        }
      }
    } catch (e) {
      console.warn("Could not fetch server documents:", e);
    }

    // 3. Fetch local storage drafts
    const localItems: PostItem[] = [];
    try {
      const localPosts = DraftManager.getLocalPosts();
      for (const p of localPosts) {
        if (!serverItems.some((s) => s.id === p.id || s.slug === p.slug)) {
          localItems.push({
            id: p.id || `local-${Date.now()}`,
            title: p.title || "Untitled Local Draft",
            slug: p.slug || "untitled-draft",
            excerpt: p.excerpt,
            status: (p.status as any) || "DRAFT",
            scheduledFor: p.scheduledFor,
            updatedAt: p.updatedAt || new Date().toISOString(),
            isLocalOnly: true,
            author: { name: "Resident Author", role: "Local Draft" },
          });
        }
      }
    } catch (e) {
      console.warn("Could not load local drafts:", e);
    }

    const combined = [...serverItems, ...localItems];
    setPosts(combined);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
    const handleAuthChange = () => loadAllData();
    window.addEventListener("inkforge_auth_change", handleAuthChange);
    return () => window.removeEventListener("inkforge_auth_change", handleAuthChange);
  }, [loadAllData]);

  // Book Publication Toggle
  const handleToggleBookPublish = async (book: BookItem) => {
    const isCurrentlyPublished = book.visibility === "PUBLIC" && book.status === "PUBLISHED";
    const endpoint = isCurrentlyPublished
      ? `/api/v1/books/${book.id}/unpublish`
      : `/api/v1/books/${book.id}/publish`;

    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to alter book visibility.");
      }

      setStatusNotice(
        isCurrentlyPublished
          ? `"${book.title}" is now Private (Only Me).`
          : `"${book.title}" is now Published to the Public Archive!`
      );
      setTimeout(() => setStatusNotice(null), 5000);
      await loadAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Visibility toggle failed.");
    }
  };

  // Delete Book
  const handleDeleteBook = async (book: BookItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you wish to permanently decommission and delete the volume "${book.title}"? This will remove all associated chapters.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/v1/books/${book.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to delete volume.");
      }
      setStatusNotice(`Volume "${book.title}" permanently decommissioned.`);
      setTimeout(() => setStatusNotice(null), 4000);
      await loadAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Deletion failed.");
    }
  };

  // Handle migration of local drafts
  const handleMigrateAll = async () => {
    const localOnly = posts.filter((p) => p.isLocalOnly && !p.id.startsWith("sample-"));
    if (localOnly.length === 0 || isMigrating) return;

    setIsMigrating(true);
    let count = 0;
    try {
      for (const p of localOnly) {
        const res = await fetch("/api/v1/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: p.title,
            excerpt: p.excerpt || "",
            status: p.status,
          }),
        });
        if (res.ok) {
          DraftManager.markDraftMigrated(`post_${p.slug || p.id}`);
          count++;
        }
      }
      setStatusNotice(`Synced ${count} local manuscript(s) to cloud ledger!`);
      setTimeout(() => setStatusNotice(null), 4000);
      await loadAllData();
    } catch (e) {
      console.error("Migration error:", e);
      setStatusNotice("Failed to sync some manuscripts.");
    } finally {
      setIsMigrating(false);
    }
  };

  // Handle deleting a manuscript leaf
  const handleDeletePost = async (post: PostItem) => {
    const confirmDelete = window.confirm(`Are you sure you wish to permanently delete "${post.title}"?`);
    if (!confirmDelete) return;

    try {
      if (post.isLocalOnly) {
        DraftManager.removeLocalPost(post.id);
        DraftManager.removeLocalPost(post.slug);
      } else {
        const res = await fetch(`/api/v1/documents/${post.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error?.message || "Failed to delete manuscript.");
          return;
        }
      }
      await loadAllData();
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  // Handle publishing a manuscript
  const handlePublishPost = async (post: PostItem) => {
    try {
      const res = await fetch(`/api/v1/documents/${post.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: post.version }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error?.message || "Failed to publish manuscript.");
        return;
      }
      setStatusNotice(`"${post.title}" is now published and live in the public archive!`);
      setTimeout(() => setStatusNotice(null), 5000);
      await loadAllData();
    } catch {
      alert("Network error while publishing manuscript.");
    }
  };

  // Handle unpublishing a manuscript
  const handleUnpublishPost = async (post: PostItem) => {
    const confirmUnpublish = window.confirm(
      `Are you sure you wish to unpublish "${post.title}"? It will be removed from public feeds and converted to a private draft.`
    );
    if (!confirmUnpublish) return;

    try {
      const res = await fetch(`/api/v1/documents/${post.id}/unpublish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: post.version }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error?.message || "Failed to unpublish manuscript.");
        return;
      }
      setStatusNotice(`"${post.title}" unpublished and converted back to a private draft.`);
      setTimeout(() => setStatusNotice(null), 5000);
      await loadAllData();
    } catch {
      alert("Network error while unpublishing manuscript.");
    }
  };

  // Handle copying share URL
  const handleSharePost = (post: PostItem) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/read/${post.slug}`;
      navigator.clipboard.writeText(url);
      setStatusNotice(`Canonical URL copied to clipboard: ${url}`);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  // Filters
  const filteredBooks = books.filter((b) => {
    if (bookFilter === "ALL") return true;
    return b.visibility === bookFilter;
  });

  const filteredPosts = posts.filter((post) => {
    if (filter === "ALL") return true;
    return post.status === filter;
  });

  const localOnlyCount = posts.filter((p) => p.isLocalOnly && !p.id.startsWith("sample-")).length;

  const getStatusBadge = (status: PostItem["status"]) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1 font-editorial-mono text-[10px] font-bold tracking-wider uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded border border-emerald-300/80 dark:border-emerald-800/60">
            <CheckCircle2 className="h-3 w-3" />
            Published Edition
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 font-editorial-mono text-[10px] font-bold tracking-wider uppercase text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 rounded border border-sky-300/80 dark:border-sky-800/60">
            <Calendar className="h-3 w-3" />
            Bound &amp; Scheduled
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 font-editorial-mono text-[10px] font-bold tracking-wider uppercase text-[var(--oxblood)] bg-[var(--oxblood-subtle)] px-2.5 py-0.5 rounded border border-[var(--oxblood)]/30">
            <Clock className="h-3 w-3" />
            In Editorial Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 font-editorial-mono text-[10px] font-bold tracking-wider uppercase text-[var(--ink-muted)] bg-[var(--paper-warm)] px-2.5 py-0.5 rounded border border-[var(--paper-border)]">
            <FileText className="h-3 w-3" />
            Draft Leaf
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Status Notice Toast */}
        {statusNotice && (
          <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Local Drafts Sync Banner */}
        {localOnlyCount > 0 && (
          <div className="mb-8 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-warm)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-3">
              <CloudUpload className="h-5 w-5 text-[var(--oxblood)] shrink-0" />
              <div>
                <h4 className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)]">
                  {localOnlyCount} Local Draft(s) Awaiting Cloud Ledger Sync
                </h4>
                <p className="font-editorial-sans text-xs text-[var(--ink-secondary)]">
                  These manuscripts are stored only in this browser. Sync them to ensure permanent multi-device access.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMigrateAll}
              disabled={isMigrating}
              className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-3.5 py-1.5 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isMigrating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
              <span>{isMigrating ? "Syncing..." : "Sync All to Ledger"}</span>
            </button>
          </div>
        )}

        {/* Page Heading & Main Action Hub */}
        <div className="mb-8 flex flex-col gap-4 border-b border-[var(--editorial-rule)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-editorial-mono text-xs font-bold uppercase tracking-widest text-[var(--oxblood)] flex items-center gap-2">
              <span>Author Atelier &amp; Library</span>
              {currentUser && (
                <span className="text-[var(--ink-muted)]">
                  · Scribe: @{currentUser.username} ({currentUser.role})
                </span>
              )}
            </div>
            <h1 className="mt-1 font-editorial-serif text-3xl sm:text-4xl font-bold text-[var(--ink-primary)]">
              The Editorial Ledger
            </h1>
            <p className="mt-1 font-editorial-serif italic text-sm text-[var(--ink-secondary)]">
              Master catalog of bound literary volumes, multi-chapter books, and manuscript leaves.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentUser && (
              <Link
                href={`/authors/${currentUser.username}`}
                className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] px-3 py-2 font-editorial-mono text-xs text-[var(--ink-primary)] transition-all hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] shadow-xs"
                title="View your public author folio"
              >
                <User className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                <span className="hidden sm:inline">Author Folio</span>
              </Link>
            )}

            {/* Secondary Action: Import Manuscript Wizard */}
            <button
              type="button"
              onClick={() => setImportWizardOpen(true)}
              className="inline-flex items-center space-x-2 rounded-md border border-[var(--oxblood)] bg-[var(--paper-surface)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-[var(--oxblood)] shadow-xs transition-all hover:bg-[var(--oxblood)] hover:text-white hover:shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import Manuscript</span>
            </button>

            {/* Primary Action: Inscribe New Book Modal */}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Inscribe New Book</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: BOUND VOLUMES & MULTI-CHAPTER BOOKS */}
        <section className="mb-14">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--editorial-rule)] pb-3">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-[var(--oxblood)]" />
              <h2 className="font-editorial-serif text-xl font-bold text-[var(--ink-primary)]">
                Bound Volumes &amp; Books
              </h2>
              <span className="rounded-full bg-[var(--oxblood-subtle)] px-2.5 py-0.5 font-editorial-mono text-[10px] font-bold text-[var(--oxblood)]">
                {books.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Visibility Filter */}
              <div className="flex items-center rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] p-0.5 font-editorial-mono text-[10px]">
                {(["ALL", "PRIVATE", "PUBLIC"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBookFilter(mode)}
                    className={`px-2.5 py-1 rounded uppercase tracking-wider transition-all cursor-pointer ${
                      bookFilter === mode
                        ? "bg-[var(--oxblood)] text-white font-bold"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    {mode === "ALL" ? "All Volumes" : mode === "PRIVATE" ? "Private (Only Me)" : "Published (Public)"}
                  </button>
                ))}
              </div>

              {/* View Switcher: Grid vs List */}
              <div className="flex items-center rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] p-0.5">
                <button
                  type="button"
                  onClick={() => setBookViewMode("grid")}
                  className={`p-1 rounded cursor-pointer ${
                    bookViewMode === "grid" ? "bg-[var(--oxblood)] text-white" : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  }`}
                  title="Grid View (Book Covers)"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setBookViewMode("list")}
                  className={`p-1 rounded cursor-pointer ${
                    bookViewMode === "list" ? "bg-[var(--oxblood)] text-white" : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  }`}
                  title="List View (Table Register)"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Book Library Display */}
          {isLoading ? (
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-12 text-center space-y-3">
              <Loader2 className="mx-auto h-6 w-6 text-[var(--oxblood)] animate-spin" />
              <p className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
                Retrieving bound volumes from registry...
              </p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--paper-border)] bg-[var(--paper-surface)]/50 p-12 text-center space-y-4">
              <BookOpen className="mx-auto h-10 w-10 text-[var(--oxblood)] opacity-50" />
              <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                {books.length === 0 ? "No Bound Volumes Yet Inscribed" : "No volumes match the selected filter"}
              </h3>
              <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)] max-w-md mx-auto">
                Create a full book with ordered chapters. You can write chapters directly in the studio, paste existing manuscripts, or upload Word (.docx) and PDF files.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Inscribe Your First Book</span>
                </button>
              </div>
            </div>
          ) : bookViewMode === "grid" ? (
            /* GRID VIEW: Tactile Literary Book Cards */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBooks.map((b) => {
                const totalWords = (b.chapters || []).reduce((acc, ch) => acc + (ch.wordCount || 0), 0);
                const isPub = b.visibility === "PUBLIC" && b.status === "PUBLISHED";

                return (
                  <div
                    key={b.id}
                    className="group relative rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--oxblood)] hover:shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3 text-[10px] font-editorial-mono">
                        <span className="font-bold text-[var(--oxblood)] uppercase tracking-wider">
                          {b.genre || "Literary Volume"}
                        </span>

                        {isPub ? (
                          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80">
                            <Globe className="h-3 w-3" />
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-300/80">
                            <Lock className="h-3 w-3" />
                            Private
                          </span>
                        )}
                      </div>

                      {/* Title & Subtitle */}
                      <Link href={`/books/${b.id}`} className="block">
                        <h3 className="font-editorial-serif text-xl font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors leading-snug">
                          {b.title}
                        </h3>
                        {b.subtitle && (
                          <p className="mt-1 font-editorial-serif italic text-xs text-[var(--ink-secondary)] line-clamp-1">
                            {b.subtitle}
                          </p>
                        )}
                      </Link>

                      {/* Description */}
                      {b.description && (
                        <p className="mt-2.5 font-editorial-serif text-xs text-[var(--ink-secondary)] leading-relaxed line-clamp-2">
                          {b.description}
                        </p>
                      )}

                      {/* Metadata Row */}
                      <div className="mt-4 flex flex-wrap items-center gap-3 font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3 text-[var(--oxblood)]" />
                          {b.chapters?.length || 0} Chapter(s)
                        </span>
                        {totalWords > 0 && (
                          <span>• {totalWords.toLocaleString()} words</span>
                        )}
                        {b.sourceFilename && (
                          <span className="line-clamp-1" title={b.sourceFilename}>
                            • from {b.sourceFilename}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-5 pt-3.5 border-t border-[var(--editorial-rule)] flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <Link
                          href={`/books/${b.id}`}
                          className="inline-flex items-center space-x-1 rounded px-2.5 py-1 text-xs font-editorial-sans font-semibold uppercase tracking-wider bg-[var(--oxblood)] text-white hover:bg-[var(--oxblood-hover)] shadow-xs transition-all"
                          title="Read volume continuously"
                        >
                          <BookOpen className="h-3 w-3" />
                          <span>Read</span>
                        </Link>

                        <Link
                          href={`/write?bookId=${b.id}`}
                          className="inline-flex items-center space-x-1 rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] px-2 py-1 text-xs font-editorial-mono text-[var(--ink-primary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] transition-all"
                          title="Write or add chapters in studio"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span className="hidden sm:inline">Write</span>
                        </Link>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setHistoryModalTarget(b)}
                          className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--oxblood)] hover:bg-[var(--paper-warm)] transition-colors cursor-pointer"
                          title="View revision history"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleBookPublish(b)}
                          className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--oxblood)] hover:bg-[var(--paper-warm)] transition-colors cursor-pointer"
                          title={isPub ? "Unpublish to Private" : "Publish to Public"}
                        >
                          {isPub ? <Globe className="h-3.5 w-3.5 text-emerald-600" /> : <Lock className="h-3.5 w-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBook(b)}
                          className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--oxblood)] hover:bg-[var(--paper-warm)] transition-colors cursor-pointer"
                          title="Delete volume"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW: Table Register */
            <div className="overflow-hidden rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)]">
              <table className="w-full text-left font-editorial-serif text-sm">
                <thead className="border-b border-[var(--editorial-rule)] bg-[var(--paper-warm)] font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-4 py-3">Volume Title</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Genre</th>
                    <th className="px-4 py-3">Chapters</th>
                    <th className="px-4 py-3">Visibility</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--editorial-rule)]">
                  {filteredBooks.map((b) => {
                    const isPub = b.visibility === "PUBLIC" && b.status === "PUBLISHED";
                    return (
                      <tr key={b.id} className="hover:bg-[var(--paper-warm)]/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <Link href={`/books/${b.id}`} className="font-bold text-[var(--ink-primary)] hover:text-[var(--oxblood)] transition-colors">
                            {b.title}
                          </Link>
                          {b.subtitle && (
                            <div className="font-editorial-serif italic text-xs text-[var(--ink-secondary)] line-clamp-1">
                              {b.subtitle}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-editorial-mono text-xs hidden sm:table-cell text-[var(--ink-muted)]">
                          {b.genre || "Volume"}
                        </td>
                        <td className="px-4 py-3.5 font-editorial-mono text-xs">
                          {b.chapters?.length || 0} chapters
                        </td>
                        <td className="px-4 py-3.5">
                          {isPub ? (
                            <span className="inline-flex items-center gap-1 font-editorial-mono text-[9px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                              <Globe className="h-2.5 w-2.5" />
                              Public
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-editorial-mono text-[9px] uppercase font-bold text-amber-800 dark:text-amber-200">
                              <Lock className="h-2.5 w-2.5" />
                              Private
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <Link
                              href={`/books/${b.id}`}
                              className="rounded p-1 text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors"
                              title="Read"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                              href={`/write?bookId=${b.id}`}
                              className="rounded p-1 text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors"
                              title="Write"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setHistoryModalTarget(b)}
                              className="rounded p-1 text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors cursor-pointer"
                              title="History"
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBook(b)}
                              className="rounded p-1 text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SECTION 2: STANDALONE MANUSCRIPT LEAVES & DISPATCHES */}
        <section className="pt-6 border-t-2 border-[var(--editorial-rule)]">
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowStandaloneSection(!showStandaloneSection)}
              className="flex items-center space-x-2 text-left cursor-pointer group"
            >
              <FileText className="h-4 w-4 text-[var(--oxblood)]" />
              <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors">
                Standalone Folio Leaves &amp; Dispatches ({posts.length})
              </h3>
              {showStandaloneSection ? <ChevronUp className="h-4 w-4 text-[var(--ink-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--ink-muted)]" />}
            </button>

            <Link
              href="/write"
              className="inline-flex items-center space-x-1.5 text-xs font-editorial-mono uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--oxblood)]"
            >
              <Plus className="h-3 w-3" />
              <span>Inscribe Single Leaf</span>
            </Link>
          </div>

          {showStandaloneSection && (
            <>
              {/* Tab Filters */}
              <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[var(--editorial-rule)] pb-3 font-editorial-mono text-xs">
                {(["ALL", "DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`rounded-md px-3 py-1 transition-colors uppercase tracking-wider shadow-xs cursor-pointer ${
                      filter === tab
                        ? "bg-[var(--oxblood)] text-white font-bold"
                        : "bg-[var(--paper-warm)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--paper-border)]"
                    }`}
                  >
                    {tab === "ALL" ? "All Leaves" : tab.replace("_", " ")}
                    <span className="ml-1 opacity-70">
                      ({tab === "ALL" ? posts.length : posts.filter((p) => p.status === tab).length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Manuscript Leaves List */}
              <div className="space-y-3">
                {filteredPosts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--paper-border)] p-8 text-center space-y-2">
                    <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)]">
                      No individual manuscript leaves filed in this index.
                    </p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="group flex flex-col justify-between rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 transition-all hover:border-[var(--oxblood)] sm:flex-row sm:items-center gap-4"
                    >
                      <div className="space-y-1.5 sm:max-w-2xl flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {getStatusBadge(post.status)}
                          {post.isLocalOnly && (
                            <span className="font-editorial-mono text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-300">
                              Local Draft Only
                            </span>
                          )}
                          {post.version && (
                            <span className="font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                              v{post.version}
                            </span>
                          )}
                        </div>

                        <h4 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)] transition-colors group-hover:text-[var(--oxblood)]">
                          {post.title}
                        </h4>

                        {post.excerpt && (
                          <p className="line-clamp-1 font-editorial-serif text-xs text-[var(--ink-secondary)] italic">
                            {post.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {post.status === "PUBLISHED" ? (
                          <>
                            <Link
                              href={`/read/${post.slug}`}
                              target="_blank"
                              className="flex items-center space-x-1 rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] px-2.5 py-1 font-editorial-mono text-xs text-[var(--ink-primary)] hover:border-[var(--oxblood)] shadow-xs"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Read</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleSharePost(post)}
                              className="flex items-center space-x-1 rounded-md border border-[var(--oxblood)] bg-[var(--oxblood-subtle)] px-2.5 py-1 font-editorial-mono text-xs text-[var(--oxblood)] hover:bg-[var(--oxblood)] hover:text-white transition-colors cursor-pointer"
                            >
                              <Share2 className="h-3 w-3" />
                              <span>Share</span>
                            </button>

                            {!post.id.startsWith("sample-") && !post.isLocalOnly && (
                              <button
                                type="button"
                                onClick={() => handleUnpublishPost(post)}
                                className="flex items-center space-x-1 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2 py-1 font-editorial-mono text-xs text-[var(--ink-secondary)] hover:text-[var(--oxblood)] cursor-pointer"
                              >
                                <Lock className="h-3 w-3" />
                                <span>Unpublish</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/read/${post.slug}?preview=true`}
                              className="flex items-center space-x-1 rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] px-2.5 py-1 font-editorial-mono text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Preview</span>
                            </Link>

                            {!post.id.startsWith("sample-") && !post.isLocalOnly && (
                              <button
                                type="button"
                                onClick={() => handlePublishPost(post)}
                                className="flex items-center space-x-1 rounded-md bg-[var(--oxblood)] text-white px-2.5 py-1 font-editorial-mono text-xs font-semibold hover:bg-[var(--oxblood-hover)] cursor-pointer"
                              >
                                <Send className="h-3 w-3" />
                                <span>Publish</span>
                              </button>
                            )}
                          </>
                        )}

                        <Link
                          href={post.isLocalOnly ? "/write" : `/write?id=${post.id}`}
                          className="flex items-center space-x-1 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1 font-editorial-mono text-xs text-[var(--ink-primary)] hover:border-[var(--oxblood)] shadow-xs"
                        >
                          <Edit3 className="h-3 w-3 text-[var(--oxblood)]" />
                          <span>Inscribe</span>
                        </Link>

                        {!post.id.startsWith("sample-") && (
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post)}
                            className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors cursor-pointer"
                            title="Delete manuscript"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Dedicated Manuscript Import Wizard */}
      {importWizardOpen && (
        <ManuscriptImportWizard
          isOpen={importWizardOpen}
          onClose={() => setImportWizardOpen(false)}
          onBookCreated={() => {
            loadAllData();
          }}
        />
      )}

      {/* Book Creation Modal */}
      {createModalOpen && (
        <BookCreateModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onBookCreated={() => {
            loadAllData();
          }}
        />
      )}

      {/* Book Revision History Modal */}
      {historyModalTarget && (
        <BookHistoryModal
          isOpen={Boolean(historyModalTarget)}
          onClose={() => setHistoryModalTarget(null)}
          bookId={historyModalTarget.id}
          bookTitle={historyModalTarget.title}
          onRestored={() => {
            loadAllData();
          }}
        />
      )}
    </div>
  );
}
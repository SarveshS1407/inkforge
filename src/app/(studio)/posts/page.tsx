"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { getStoredBooks } from "@/lib/book-store";
import { BookIdentity } from "@/types/book";
import { DraftManager, LocalDraftData } from "@/lib/drafts/draft-manager";
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
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";

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

const DEFAULT_POSTS: PostItem[] = [
  {
    id: "sample-1",
    title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
    slug: "crafting-systems-that-endure",
    excerpt: "Modern engineering often rushes to ship ephemeral features. But the truest software architecture mirrors literature...",
    status: "PUBLISHED",
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    author: { name: "Elena Rostova", role: "Chair of Architectural Studies" },
  },
  {
    id: "sample-2",
    title: "Drafting the New Editorial Standard for Digital Journalism",
    slug: "drafting-the-new-editorial-standard",
    excerpt: "Exploring how collaborative block editors can eliminate round-trip editorial bottlenecks...",
    status: "IN_REVIEW",
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    author: { name: "Marcus Chen", role: "Editorial Essayist" },
  },
  {
    id: "sample-3",
    title: "Weekly Dispatch: Autumn Inks & Typographic Notes",
    slug: "weekly-dispatch-autumn-inks",
    excerpt: "Scheduled for Friday release across subscriber channels and the central publication portal...",
    status: "SCHEDULED",
    scheduledFor: new Date(Date.now() + 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    author: { name: "Elena Rostova", role: "Chair of Architectural Studies" },
  },
  {
    id: "sample-4",
    title: "Notes on Local-First Autosave Mechanisms in Web Apps",
    slug: "notes-on-local-first-autosave",
    excerpt: "A technical scratchpad exploring IndexedDB vs localStorage fallback strategies for authors...",
    status: "DRAFT",
    updatedAt: new Date().toISOString(),
    author: { name: "Sarah Lindqvist", role: "Staff Fellow" },
  },
];

export default function PostsDashboardPage() {
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED">("ALL");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [books, setBooks] = useState<BookIdentity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    let serverItems: PostItem[] = [];

    // 1. Fetch server documents from authenticated API
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

    // 2. Fetch local storage drafts
    const localItems: PostItem[] = [];
    try {
      const localPosts = DraftManager.getLocalPosts();
      for (const p of localPosts) {
        // If not already matched in server items
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

    // 3. Combine server items, local items, and default samples if empty
    const combined = [...serverItems, ...localItems];
    if (combined.length === 0) {
      setPosts(DEFAULT_POSTS);
    } else {
      setPosts(combined);
    }

    try {
      setBooks(getStoredBooks());
    } catch {
      // Ignored
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadDocuments();
    const handleAuthChange = () => loadDocuments();
    window.addEventListener("inkforge_auth_change", handleAuthChange);
    return () => window.removeEventListener("inkforge_auth_change", handleAuthChange);
  }, [loadDocuments]);

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
      await loadDocuments();
    } catch (e) {
      console.error("Migration error:", e);
      setStatusNotice("Failed to sync some manuscripts.");
    } finally {
      setIsMigrating(false);
    }
  };

  // Handle deleting a manuscript
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
      await loadDocuments();
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

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
            Draft Manuscript
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
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

        {/* Page Heading */}
        <div className="mb-8 flex flex-col gap-4 border-b border-[var(--editorial-rule)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-editorial-mono text-xs font-bold uppercase tracking-widest text-[var(--oxblood)]">
              Registry &amp; Publishing Catalogue
            </div>
            <h1 className="mt-1 font-editorial-serif text-3xl sm:text-4xl font-bold text-[var(--ink-primary)]">
              The Editorial Ledger
            </h1>
            <p className="mt-1 font-editorial-serif italic text-sm text-[var(--ink-secondary)]">
              Official register of active manuscripts, editorial reviews, and published editions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/write"
              className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oxblood)]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Inscribe Manuscript</span>
            </Link>
          </div>
        </div>

        {/* Bound Volumes Showcase */}
        {books.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--editorial-rule)] pb-2 font-editorial-mono text-xs">
              <span className="font-bold uppercase tracking-widest text-[var(--oxblood)]">
                Bound Volumes &amp; Custom Editions ({books.length})
              </span>
              <Link
                href="/books/create"
                className="text-[10px] uppercase text-[var(--ink-muted)] hover:text-[var(--oxblood)] hover:underline inline-flex items-center gap-1"
              >
                <span>Inscribe Another</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((b) => (
                <Link
                  key={b.id}
                  href={`/books/${b.id}`}
                  className="group rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--oxblood)] hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] mb-2">
                      <span className="text-[var(--oxblood)] font-bold">{b.genre}</span>
                      <span>{b.state}</span>
                    </div>

                    <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors leading-snug">
                      {b.title}
                    </h3>

                    {b.subtitle && (
                      <p className="mt-1 font-editorial-serif italic text-xs text-[var(--ink-secondary)] line-clamp-1">
                        {b.subtitle}
                      </p>
                    )}

                    <p className="mt-2.5 font-editorial-serif text-xs text-[var(--ink-secondary)] leading-relaxed line-clamp-2">
                      {b.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--editorial-rule)] flex items-center justify-between font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                    <span>By {b.author}</span>
                    <span className="text-[var(--oxblood)] font-bold inline-flex items-center gap-1">
                      <span>Open Book</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tab Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-[var(--editorial-rule)] pb-4 font-editorial-mono text-xs">
          {(["ALL", "DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-md px-3 py-1.5 transition-colors uppercase tracking-wider shadow-xs cursor-pointer ${
                filter === tab
                  ? "bg-[var(--oxblood)] text-white font-bold"
                  : "bg-[var(--paper-warm)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--paper-border)]"
              }`}
            >
              {tab === "ALL" ? "All Folios" : tab.replace("_", " ")}
              <span className="ml-1.5 opacity-70">
                ({tab === "ALL" ? posts.length : posts.filter((p) => p.status === tab).length})
              </span>
            </button>
          ))}
        </div>

        {/* Manuscript List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="book-jacket rounded-xl p-12 text-center space-y-2">
              <Loader2 className="mx-auto h-6 w-6 text-[var(--oxblood)] animate-spin" />
              <p className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
                Querying the permanent ledger...
              </p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="book-jacket rounded-xl p-12 text-center space-y-3">
              <BookOpen className="mx-auto h-8 w-8 text-[var(--oxblood)] mb-1 opacity-70" />
              <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                No manuscripts filed in this index
              </h3>
              <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)] max-w-sm mx-auto">
                Every draft you compose in the Scribe Studio is automatically preserved here in your ledger.
              </p>
              <div className="pt-2">
                <Link
                  href="/write"
                  className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Compose First Manuscript</span>
                </Link>
              </div>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="book-jacket group flex flex-col justify-between rounded-xl p-6 transition-all sm:flex-row sm:items-center gap-4"
              >
                <div className="space-y-2 sm:max-w-2xl flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    {getStatusBadge(post.status)}
                    {post.isLocalOnly && (
                      <span className="font-editorial-mono text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                        Local Draft Only
                      </span>
                    )}
                    {post.version && (
                      <span className="font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                        v{post.version}
                      </span>
                    )}
                    {post.scheduledFor && (
                      <span className="font-editorial-mono text-[11px] text-[var(--ink-muted)] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Target: {new Date(post.scheduledFor).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h3 className="font-editorial-serif text-xl font-bold text-[var(--ink-primary)] transition-colors group-hover:text-[var(--oxblood)]">
                    {post.title}
                  </h3>

                  {post.excerpt && (
                    <p className="line-clamp-1 font-editorial-serif text-xs text-[var(--ink-secondary)] italic">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                    Updated {new Date(post.updatedAt).toLocaleDateString()} by {post.author.name}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <Link
                    href={`/read/${post.slug}`}
                    className="flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] px-3 py-1.5 font-editorial-mono text-xs text-[var(--ink-primary)] transition-colors hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] shadow-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Read</span>
                  </Link>

                  <Link
                    href={post.isLocalOnly ? "/write" : `/write?id=${post.id}`}
                    className="flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] text-white px-3 py-1.5 font-editorial-mono text-xs transition-colors hover:bg-[var(--oxblood-hover)] shadow-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Inscribe</span>
                  </Link>

                  {!post.id.startsWith("sample-") && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post)}
                      className="p-1.5 rounded-md text-[var(--ink-muted)] hover:text-[var(--oxblood)] hover:bg-[var(--paper-warm)] transition-colors cursor-pointer"
                      title="Delete manuscript"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

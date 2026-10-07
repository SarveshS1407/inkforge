"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import {
  FileText,
  Clock,
  Calendar,
  Eye,
  Edit3,
  Plus,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

interface PostItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED";
  scheduledFor?: string | null;
  updatedAt: string;
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
  const [posts, setPosts] = useState<PostItem[]>(DEFAULT_POSTS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("inkforge_all_posts");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts([...parsed, ...DEFAULT_POSTS]);
        }
      }
    } catch (e) {
      console.error("Failed to load local posts", e);
    }
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (filter === "ALL") return true;
    return post.status === filter;
  });

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

          <Link
            href="/write"
            className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-sm active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Inscribe New Work</span>
          </Link>
        </div>

        {/* Tab Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-[var(--editorial-rule)] pb-4 font-editorial-mono text-xs">
          {(["ALL", "DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-md px-3 py-1.5 transition-colors uppercase tracking-wider shadow-xs ${
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
          {filteredPosts.length === 0 ? (
            <div className="book-jacket rounded-xl p-12 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-[var(--ink-muted)] mb-3" />
              <h3 className="font-editorial-serif text-base font-bold text-[var(--ink-primary)]">
                No manuscripts filed in this index
              </h3>
              <p className="mt-1 font-editorial-serif italic text-xs text-[var(--ink-secondary)]">
                Open the Scribe studio desk to begin drafting a new monograph.
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="book-jacket group flex flex-col justify-between rounded-xl p-6 transition-all sm:flex-row sm:items-center"
              >
                <div className="space-y-2 sm:max-w-2xl">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(post.status)}
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
                </div>

                <div className="mt-4 flex items-center space-x-2 sm:mt-0">
                  <Link
                    href={`/read/${post.slug}`}
                    className="flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] px-3 py-1.5 font-editorial-mono text-xs text-[var(--ink-primary)] transition-colors hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] shadow-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Read</span>
                  </Link>

                  <Link
                    href="/write"
                    className="flex items-center space-x-1.5 rounded-md bg-[var(--paper-warm)] border border-[var(--paper-border)] px-3 py-1.5 font-editorial-mono text-xs text-[var(--ink-primary)] transition-colors hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] shadow-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Inscribe</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

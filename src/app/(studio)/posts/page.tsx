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
  AlertCircle,
  Filter,
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
    author: { name: "Elena Rostova", role: "Lead Architect" },
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
    author: { name: "Elena Rostova", role: "Lead Architect" },
  },
  {
    id: "sample-4",
    title: "Notes on Local-First Autosave Mechanisms in Web Apps",
    slug: "notes-on-local-first-autosave",
    excerpt: "A technical scratchpad exploring IndexedDB vs localStorage fallback strategies for authors...",
    status: "DRAFT",
    updatedAt: new Date().toISOString(),
    author: { name: "Elena Rostova", role: "Lead Architect" },
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
          // Combine user created posts with defaults
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
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Published
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
            <Calendar className="h-3 w-3" />
            Scheduled
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
            <Clock className="h-3 w-3" />
            In Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
            <FileText className="h-3 w-3" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#f1f2f4]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-extrabold text-white">Stories & Editorial</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage your drafts, review pipelines, and scheduled publications.
            </p>
          </div>

          <Link
            href="/write"
            className="inline-flex items-center space-x-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Story</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-4 text-xs font-medium">
          {(["ALL", "DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                filter === tab
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {tab === "ALL" ? "All Stories" : tab.replace("_", " ")}
              <span className="ml-1.5 rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500">
                {tab === "ALL" ? posts.length : posts.filter((p) => p.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* Stories List */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
              <h3 className="text-sm font-medium text-zinc-300">No stories in this view</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Start writing a fresh piece or change the filter tab.
              </p>
              <Link
                href="/write"
                className="mt-4 inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300"
              >
                <span>Open Studio</span>
                <span>&rarr;</span>
              </Link>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="group flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/60 sm:flex-row sm:items-center"
              >
                <div className="space-y-1.5 sm:max-w-xl">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(post.status)}
                    {post.scheduledFor && (
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Target: {new Date(post.scheduledFor).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-lg font-bold text-white transition-colors group-hover:text-amber-300">
                    {post.title}
                  </h3>

                  {post.excerpt && (
                    <p className="line-clamp-1 text-xs text-zinc-400">{post.excerpt}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center space-x-2 border-t border-zinc-800/60 pt-3 sm:mt-0 sm:border-t-0 sm:pt-0">
                  <Link
                    href={`/read/${post.slug}`}
                    className="flex items-center space-x-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                  </Link>

                  <Link
                    href="/write"
                    className="flex items-center space-x-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
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

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { AddToCollectionModal } from "@/components/collections/AddToCollectionModal";
import {
  Compass,
  Search,
  Clock,
  ArrowRight,
  Layers,
  Users,
  Bookmark,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Loader2,
  BookOpen,
} from "lucide-react";

interface Story {
  id?: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  authorUsername?: string;
  role: string;
  date: string;
  readingTime: string;
  readingMinutes?: number;
}

const STATIC_STORIES: Story[] = [
  {
    slug: "crafting-systems-that-endure",
    category: "SYSTEMS CRAFT",
    title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
    excerpt:
      "Software engineering suffers from a pervasive bias toward the ephemeral. Yet there exists another lineage in software — one rooted in permanence and architectural gravitas.",
    author: "Elena Rostova",
    role: "Chair of Architectural Studies",
    date: "Autumn 2026",
    readingTime: "6 min read",
    readingMinutes: 6,
  },
  {
    slug: "the-death-and-rebirth-of-the-independent-web",
    category: "LITERARY ECOLOGY",
    title: "The Rebirth of the Independent Web: Why Writers Are Leaving Algorithmic Silos",
    excerpt:
      "Feeds incentivize outrage and decay attention. A new renaissance of dedicated publications, newsletters, and bespoke digital spaces is quietly reclaiming the sovereign written word.",
    author: "Marcus Chen",
    role: "Editorial Essayist",
    date: "Autumn 2026",
    readingTime: "4 min read",
    readingMinutes: 4,
  },
  {
    slug: "block-based-composition-in-modern-publishing",
    category: "SYSTEMS CRAFT",
    title: "The Architecture of Block Composition: From ProseMirror ASTs to Dynamic Canvases",
    excerpt:
      "How decoupling content blocks from rigid HTML structures unlocks programmable narratives, responsive media embeds, and effortless multi-format syndication across print and digital mediums.",
    author: "David Vance",
    role: "Principal Frontend Engineer",
    date: "Autumn 2026",
    readingTime: "8 min read",
    readingMinutes: 8,
  },
  {
    slug: "notes-on-local-first-autosave",
    category: "DIGITAL THEORY",
    title: "The Scribe's Sanctuary: Local-First Draft Persistence in Uncertain Networks",
    excerpt:
      "An exploration of resilient state architectures that guarantee no author ever loses a syllable, even during network turbulence or power failure.",
    author: "Sarah Lindqvist",
    role: "Staff Fellow",
    date: "Autumn 2026",
    readingTime: "5 min read",
    readingMinutes: 5,
  },
];

const TOPICS = [
  "ALL",
  "SYSTEMS CRAFT",
  "LITERARY ECOLOGY",
  "DIGITAL THEORY",
];

const PAGE_SIZE = 10;

export default function DiscoverPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("ALL");
  const [readingTimeFilter, setReadingTimeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "readingTime" | "title" | "oldest">("newest");
  const [page, setPage] = useState<number>(1);

  // Modal state
  const [selectedPostForCollection, setSelectedPostForCollection] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const params = new URLSearchParams();
      params.set("status", "PUBLISHED");
      params.set("limit", PAGE_SIZE.toString());
      params.set("offset", offset.toString());
      params.set("sortBy", sortBy);

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      if (readingTimeFilter && readingTimeFilter !== "all") {
        params.set("readingTime", readingTimeFilter);
      }

      const res = await fetch(`/api/v1/documents?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load documents");
      }
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const fetchedStories: Story[] = json.data.map((item: any) => ({
          id: item.id,
          slug: item.slug,
          category: item.publication?.name?.toUpperCase() || "MONOGRAPH",
          title: item.title,
          excerpt:
            item.excerpt ||
            (item.contentHtml
              ? item.contentHtml.replace(/<[^>]+>/g, "").slice(0, 160) + "..."
              : "A recently inscribed monograph published on Inkforge."),
          author: item.author?.displayName || item.author?.username || "Resident Author",
          authorUsername: item.author?.username,
          role: "Published Author",
          date: item.publishedAt
            ? new Date(item.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Recently Published",
          readingTime: `${item.readingTimeMinutes || 4} min read`,
          readingMinutes: item.readingTimeMinutes || 4,
        }));

        const total = json.pagination?.total ?? fetchedStories.length;

        // If no records in database and no query is entered, fall back to static editorial seeds
        if (total === 0 && !searchQuery.trim() && readingTimeFilter === "all" && page === 1) {
          setStories(STATIC_STORIES);
          setTotalCount(STATIC_STORIES.length);
        } else {
          setStories(fetchedStories);
          setTotalCount(total);
        }
      }
    } catch (err) {
      console.warn("Could not fetch published documents for Discover feed:", err);
      // Fallback
      if (!searchQuery.trim() && readingTimeFilter === "all") {
        setStories(STATIC_STORIES);
        setTotalCount(STATIC_STORIES.length);
      } else {
        setStories([]);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, searchQuery, readingTimeFilter]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Topic filter client-side refinement
  const filteredStories = stories.filter((story) => {
    if (selectedTopic === "ALL") return true;
    return story.category.toUpperCase().includes(selectedTopic);
  });

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedTopic("ALL");
    setReadingTimeFilter("all");
    setSortBy("newest");
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedTopic !== "ALL" ||
    readingTimeFilter !== "all" ||
    sortBy !== "newest";

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center space-x-2 font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
          <Link
            href="/"
            className="hover:text-[var(--oxblood)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] rounded px-1"
          >
            Home
          </Link>
          <span>/</span>
          <span className="text-[var(--oxblood)] font-bold">Discover</span>
        </div>

        {/* Masthead */}
        <header className="border-b border-[var(--editorial-rule)] pb-10 mb-8">
          <div className="inline-flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] mb-3 font-bold">
            <Compass className="h-4 w-4" />
            <span>Catalog &amp; Explorations</span>
          </div>
          <h1 className="font-editorial-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.12]">
            Discover Great Writing
          </h1>
          <p className="font-editorial-serif text-lg text-[var(--ink-secondary)] italic mt-3 max-w-2xl">
            Explore monographs, dispatches, and treatises across publishing topics, authors, and curated folios.
          </p>

          {/* Search Bar & Controls */}
          <div className="mt-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--ink-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by title, author, or keyword (e.g. permanence, typography, web)..."
                className="w-full rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] pl-10 pr-10 py-2.5 font-editorial-sans text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/60 focus:border-[var(--oxblood)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPage(1);
                  }}
                  className="absolute right-3.5 top-3.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Bar: Durations, Sorting, Reset */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Reading Time Pills */}
              <div className="flex flex-wrap items-center gap-1.5 font-editorial-mono text-xs">
                <span className="text-[var(--ink-muted)] text-[10px] uppercase tracking-wider mr-1">
                  Length:
                </span>
                {[
                  { id: "all", label: "All" },
                  { id: "short", label: "≤ 4 min" },
                  { id: "medium", label: "5–10 min" },
                  { id: "long", label: "> 10 min" },
                ].map((item) => {
                  const isSelected = readingTimeFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setReadingTimeFilter(item.id);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[var(--oxblood)] text-white border-[var(--oxblood)] font-bold shadow-2xs"
                          : "bg-[var(--paper-surface)] text-[var(--ink-secondary)] border-[var(--paper-border)] hover:border-[var(--oxblood)]/60"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Sorting and Filter Reset */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 font-editorial-mono text-xs">
                  <span className="text-[var(--ink-muted)] text-[10px] uppercase tracking-wider">
                    Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      setPage(1);
                    }}
                    className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1 text-xs font-editorial-sans text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="readingTime">Reading Time</option>
                    <option value="title">Title (A–Z)</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] font-editorial-mono text-[var(--oxblood)] hover:underline uppercase tracking-wider font-semibold cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Topic Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--editorial-rule)]/60">
              <div
                role="tablist"
                aria-label="Topics"
                className="flex flex-wrap gap-2 font-editorial-mono text-xs uppercase tracking-wider"
              >
                {TOPICS.map((topic) => {
                  const isSelected = selectedTopic === topic;
                  return (
                    <button
                      key={topic}
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedTopic(topic)}
                      className={`px-3 py-1 rounded-md border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[var(--oxblood-subtle)] text-[var(--oxblood)] border-[var(--oxblood)] font-bold"
                          : "bg-[var(--paper-surface)] text-[var(--ink-secondary)] border-[var(--paper-border)] hover:border-[var(--oxblood)]/60"
                      }`}
                    >
                      <span>{topic === "ALL" ? "All Subjects" : topic}</span>
                    </button>
                  );
                })}
              </div>

              <div className="font-editorial-mono text-[11px] text-[var(--ink-muted)]">
                {isLoading ? (
                  <span className="flex items-center space-x-1">
                    <Loader2 className="h-3 w-3 animate-spin text-[var(--oxblood)]" />
                    <span>Searching archive...</span>
                  </span>
                ) : (
                  <span>
                    Showing {filteredStories.length} of {totalCount} {totalCount === 1 ? "work" : "works"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Stories Grid */}
        <section className="space-y-6 mb-12">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 font-editorial-mono text-xs text-[var(--ink-muted)]">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--oxblood)]" />
              <span>Gathering inscribed monographs...</span>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-12 text-center space-y-3 shadow-xs">
              <BookOpen className="h-8 w-8 text-[var(--ink-muted)] mx-auto opacity-60" />
              <p className="font-editorial-serif text-xl font-bold text-[var(--ink-primary)]">
                No matching writing found
              </p>
              <p className="font-editorial-sans text-xs text-[var(--ink-muted)] max-w-sm mx-auto">
                No monographs matched your search query or active filters. Try adjusting your terms or resetting filters.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] px-4 py-2 font-editorial-mono text-xs uppercase text-[var(--oxblood)] font-bold hover:border-[var(--oxblood)] transition-colors cursor-pointer"
                >
                  <span>Reset All Filters</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredStories.map((story) => (
                <article
                  key={story.slug}
                  className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-7 flex flex-col justify-between space-y-4 shadow-xs hover:border-[var(--oxblood)]/60 hover:shadow-md transition-all group relative"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--oxblood)] font-semibold">
                      <span>{story.category}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-[var(--ink-muted)] font-normal flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{story.readingTime}</span>
                        </span>

                        {/* Save to Collection Bookmark Action */}
                        <button
                          type="button"
                          onClick={() => {
                            if (story.id) {
                              setSelectedPostForCollection({
                                id: story.id,
                                title: story.title,
                              });
                            }
                          }}
                          disabled={!story.id}
                          className={`p-1 rounded text-[var(--ink-muted)] hover:text-[var(--oxblood)] hover:bg-[var(--paper-warm)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] ${
                            !story.id ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                          }`}
                          title={story.id ? "Save to Collection" : "Curated Sample Work"}
                          aria-label="Save to Collection"
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <Link
                      href={`/read/${story.slug}`}
                      className="block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] rounded"
                    >
                      <h2 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors leading-tight">
                        {story.title}
                      </h2>
                    </Link>

                    <p className="font-editorial-serif italic text-xs sm:text-sm text-[var(--ink-secondary)] line-clamp-3 leading-relaxed">
                      {story.excerpt}
                    </p>
                  </div>

                  <div className="border-t border-[var(--editorial-rule)] pt-4 flex items-center justify-between">
                    <div>
                      {story.authorUsername ? (
                        <Link
                          href={`/authors/${story.authorUsername}`}
                          className="font-editorial-sans text-xs font-semibold text-[var(--ink-primary)] hover:text-[var(--oxblood)] transition-colors block"
                        >
                          {story.author}
                        </Link>
                      ) : (
                        <span className="font-editorial-sans text-xs font-semibold text-[var(--ink-primary)] block">
                          {story.author}
                        </span>
                      )}
                      <span className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                        {story.date}
                      </span>
                    </div>

                    <Link
                      href={`/read/${story.slug}`}
                      className="font-editorial-sans text-xs font-semibold text-[var(--oxblood)] inline-flex items-center space-x-1 group-hover:translate-x-1 transition-transform focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] rounded px-1"
                    >
                      <span>Read Story</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--editorial-rule)] pt-6 font-editorial-mono text-xs">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:border-[var(--oxblood)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-[var(--ink-muted)] text-[11px]">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:border-[var(--oxblood)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* Explore Collections & Authors Banners */}
        <section className="grid gap-6 sm:grid-cols-2 mb-12">
          <Link
            href="/collections"
            className="group rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 space-y-2 hover:border-[var(--oxblood)] transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oxblood)]"
          >
            <div className="flex items-center justify-between font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold">
              <span className="flex items-center space-x-1.5">
                <Layers className="h-4 w-4" />
                <span>Thematic Collections</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] leading-relaxed">
              Explore curated anthologies gathered around systems craft, independent publishing, and typography.
            </p>
          </Link>

          <Link
            href="/authors"
            className="group rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 space-y-2 hover:border-[var(--oxblood)] transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oxblood)]"
          >
            <div className="flex items-center justify-between font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold">
              <span className="flex items-center space-x-1.5">
                <Users className="h-4 w-4" />
                <span>Resident Authors</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] leading-relaxed">
              Discover the fellows, essayists, and researchers behind the published work.
            </p>
          </Link>
        </section>
      </main>

      {/* Add to Collection Modal */}
      {selectedPostForCollection && (
        <AddToCollectionModal
          isOpen={!!selectedPostForCollection}
          onClose={() => setSelectedPostForCollection(null)}
          postId={selectedPostForCollection.id}
          postTitle={selectedPostForCollection.title}
        />
      )}
    </div>
  );
}

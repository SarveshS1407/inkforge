"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import {
  Compass,
  Search,
  BookOpen,
  Clock,
  ArrowRight,
  Layers,
  Users,
  Bookmark,
  Calendar,
  Sparkles,
} from "lucide-react";

interface Story {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  role: string;
  date: string;
  readingTime: string;
}

const ALL_STORIES: Story[] = [
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
  },
];

const TOPICS = [
  "ALL",
  "SYSTEMS CRAFT",
  "LITERARY ECOLOGY",
  "DIGITAL THEORY",
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("ALL");

  const filteredStories = ALL_STORIES.filter((story) => {
    const matchesTopic = selectedTopic === "ALL" || story.category === selectedTopic;
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center space-x-2 font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
          <Link href="/" className="hover:text-[var(--oxblood)] transition-colors">
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

          {/* Search Bar & Topic Filters */}
          <div className="mt-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--ink-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or keyword (e.g. permanence, typography, web)..."
                className="w-full rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] pl-10 pr-4 py-2.5 font-editorial-sans text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/60 focus:border-[var(--oxblood)] focus:outline-none shadow-xs"
              />
            </div>

            <div className="flex flex-wrap gap-2 font-editorial-mono text-xs uppercase tracking-wider">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3 py-1.5 rounded-md border transition-colors ${
                    selectedTopic === topic
                      ? "bg-[var(--oxblood)] text-white border-[var(--oxblood)] font-bold"
                      : "bg-[var(--paper-surface)] text-[var(--ink-secondary)] border-[var(--paper-border)] hover:border-[var(--oxblood)]"
                  }`}
                >
                  {topic === "ALL" ? "All Topics" : topic}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Featured Stories Grid */}
        <section className="space-y-6 mb-12">
          {filteredStories.length === 0 ? (
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-12 text-center space-y-3">
              <p className="font-editorial-serif text-xl font-bold text-[var(--ink-primary)]">
                No matching writing found
              </p>
              <p className="font-editorial-sans text-xs text-[var(--ink-muted)]">
                Try adjusting your search terms or choosing &quot;All Topics&quot;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTopic("ALL");
                }}
                className="mt-2 font-editorial-mono text-xs text-[var(--oxblood)] underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredStories.map((story, idx) => (
                <article
                  key={idx}
                  className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-7 flex flex-col justify-between space-y-4 shadow-xs hover:border-[var(--oxblood)]/60 transition-all group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--oxblood)] font-semibold">
                      <span>{story.category}</span>
                      <span className="text-[var(--ink-muted)] font-normal flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{story.readingTime}</span>
                      </span>
                    </div>

                    <Link href={`/read/${story.slug}`}>
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
                      <span className="font-editorial-sans text-xs font-semibold text-[var(--ink-primary)] block">
                        {story.author}
                      </span>
                      <span className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                        {story.role}
                      </span>
                    </div>

                    <Link
                      href={`/read/${story.slug}`}
                      className="font-editorial-sans text-xs font-semibold text-[var(--oxblood)] inline-flex items-center space-x-1 group-hover:translate-x-1 transition-transform"
                    >
                      <span>Read Story</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Explore Collections & Authors Banners */}
        <section className="grid gap-6 sm:grid-cols-2 mb-12">
          <Link
            href="/collections"
            className="group rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 space-y-2 hover:border-[var(--oxblood)] transition-all shadow-xs"
          >
            <div className="flex items-center justify-between font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold">
              <span className="flex items-center space-x-1.5">
                <Layers className="h-4 w-4" />
                <span>Thematic Collections</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)]">
              Explore 4 curated anthologies gathered around systems craft, independent publishing, and typography.
            </p>
          </Link>

          <Link
            href="/authors"
            className="group rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 space-y-2 hover:border-[var(--oxblood)] transition-all shadow-xs"
          >
            <div className="flex items-center justify-between font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold">
              <span className="flex items-center space-x-1.5">
                <Users className="h-4 w-4" />
                <span>Resident Authors</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)]">
              Discover the fellows, essayists, and researchers behind the work.
            </p>
          </Link>
        </section>
      </main>
    </div>
  );
}

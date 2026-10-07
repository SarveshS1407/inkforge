"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import {
  Feather,
  BookOpen,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

const LEAD_ESSAY = {
  slug: "crafting-systems-that-endure",
  chapter: "CHAPTER I",
  title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
  subtitle: "On permanence, architectural discipline, and treating digital constructs with the gravity of literature.",
  author: "Elena Rostova",
  role: "Chair of Architectural Studies",
  edition: "Issue IV • October 2026",
  readingTime: "6 min read",
  folio: "pp. 14–28",
  publication: "Architecture & Craft",
  excerpt:
    "Software engineering suffers from a pervasive bias toward the ephemeral. We measure velocity by story points burned in two-week sprints, celebrate migrations that will be reversed eighteen months later, and obsess over frameworks whose lifespans rarely outlast an oak leaf. Yet there exists another lineage in software — one rooted in permanence.",
};

const ANTHOLOGY_STORIES = [
  {
    slug: "the-death-and-rebirth-of-the-independent-web",
    category: "LITERARY ECOLOGY",
    chapter: "CHAPTER II",
    title: "The Rebirth of the Independent Web: Why Writers Are Leaving Algorithmic Silos",
    excerpt:
      "Feeds incentivize outrage and decay attention. A new renaissance of dedicated publications, newsletters, and bespoke digital spaces is quietly reclaiming the sovereign written word.",
    author: "Marcus Chen",
    role: "Editorial Essayist",
    date: "Autumn 2026",
    readingTime: "4 min read",
    folio: "pp. 29–38",
    publication: "Digital Ecology",
  },
  {
    slug: "block-based-composition-in-modern-publishing",
    category: "SYSTEMS CRAFT",
    chapter: "CHAPTER III",
    title: "The Architecture of Block Composition: From ProseMirror ASTs to Dynamic Canvases",
    excerpt:
      "How decoupling content blocks from rigid HTML structures unlocks programmable narratives, responsive media embeds, and effortless multi-format syndication across print and digital mediums.",
    author: "David Vance",
    role: "Principal Frontend Engineer",
    date: "Autumn 2026",
    readingTime: "8 min read",
    folio: "pp. 39–54",
    publication: "Inkforge Engineering",
  },
  {
    slug: "notes-on-local-first-autosave",
    category: "DIGITAL THEORY",
    chapter: "DISPATCH IV",
    title: "The Scribe's Sanctuary: Local-First Draft Persistence in Uncertain Networks",
    excerpt:
      "An exploration of resilient state architectures that guarantee no author ever loses a syllable, even during network turbulence or power failure.",
    author: "Sarah Lindqvist",
    role: "Staff Fellow",
    date: "Autumn 2026",
    readingTime: "5 min read",
    folio: "pp. 55–64",
    publication: "Systems & Theory",
  },
];

const CURATED_VOLUMES = [
  {
    number: "VOLUME I",
    title: "On Craft & Systems",
    count: "12 Monographs",
    tagline: "Foundational essays on endurance, architecture, and tool design.",
  },
  {
    number: "VOLUME II",
    title: "The Sovereign Writer",
    count: "8 Monographs",
    tagline: "Essays exploring independent distribution and literary autonomy.",
  },
  {
    number: "VOLUME III",
    title: "Block Semantics & Type",
    count: "15 Monographs",
    tagline: "The union of classical typography algorithms and digital canvases.",
  },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filteredAnthology = ANTHOLOGY_STORIES.filter(
    (story) => selectedCategory === "ALL" || story.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-[var(--paper-bg)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Living Editorial Masthead Title */}
        <section className="border-b border-[var(--editorial-rule)] pb-12 text-center">
          <div className="inline-flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] mb-4">
            <span>Autumn Anthology</span>
            <span>•</span>
            <span>Volume IV</span>
            <span>•</span>
            <span>Continuous Print</span>
          </div>

          <h1 className="font-editorial-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.06]">
            The Living Digital Book.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl font-editorial-serif text-lg sm:text-xl text-[var(--ink-secondary)] italic leading-relaxed">
            &ldquo;Where the timeless discipline of books meets the living breath of digital prose.&rdquo;
          </p>

          <div className="mt-8 flex items-center justify-center space-x-4">
            <Link
              href="/write"
              className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-5 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-sm active:scale-[0.98]"
            >
              <span>Begin Composing</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/posts"
              className="inline-flex items-center space-x-2 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-5 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] shadow-xs transition-colors hover:border-[var(--oxblood)] hover:text-[var(--ink-primary)] active:scale-[0.98]"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>View Editorial Ledger</span>
            </Link>
          </div>
        </section>

        {/* Lead Feature / Cover Story (Book-Cover Proportions) */}
        <section className="my-16">
          <div className="mb-4 flex items-center justify-between text-xs font-editorial-mono tracking-widest uppercase text-[var(--ink-muted)]">
            <span>Frontispiece &amp; Featured Essay</span>
            <span>{LEAD_ESSAY.folio}</span>
          </div>

          <div className="paper-sheet rounded-xl p-8 sm:p-12 transition-all">
            <div className="max-w-3xl">
              <span className="font-editorial-mono text-xs font-bold tracking-widest uppercase text-[var(--oxblood)]">
                {LEAD_ESSAY.chapter} • {LEAD_ESSAY.publication}
              </span>

              <Link href={`/read/${LEAD_ESSAY.slug}`} className="group block">
                <h2 className="mt-3 font-editorial-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)] transition-colors group-hover:text-[var(--oxblood)] leading-tight">
                  {LEAD_ESSAY.title}
                </h2>
              </Link>

              <p className="mt-4 font-editorial-serif text-lg text-[var(--ink-secondary)] italic leading-relaxed">
                {LEAD_ESSAY.subtitle}
              </p>

              {/* Opening paragraph with classical drop cap */}
              <div className="mt-6 border-t border-[var(--editorial-rule)] pt-6">
                <p className="drop-cap font-editorial-serif text-base sm:text-lg leading-[1.85] text-[var(--ink-secondary)]">
                  {LEAD_ESSAY.excerpt}
                </p>
              </div>

              {/* Byline & Folio Details */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--editorial-rule)] pt-5 font-editorial-sans text-xs text-[var(--ink-muted)]">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--paper-card)] border border-[var(--paper-border)] font-editorial-serif font-bold text-sm text-[var(--oxblood)]">
                    {LEAD_ESSAY.author[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--ink-primary)]">{LEAD_ESSAY.author}</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">{LEAD_ESSAY.role}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-5 font-editorial-mono text-[11px]">
                  <span>{LEAD_ESSAY.edition}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{LEAD_ESSAY.readingTime}</span>
                  </span>
                  <span>•</span>
                  <Link
                    href={`/read/${LEAD_ESSAY.slug}`}
                    className="font-bold text-[var(--oxblood)] hover:underline flex items-center gap-1 uppercase"
                  >
                    <span>Read Monograph</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Decorative Editorial Divider */}
        <div className="editorial-divider">
          <span>✦ • ✦</span>
        </div>

        {/* The Anthology / Table of Contents Section */}
        <section className="my-16">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[var(--editorial-rule)] pb-4 gap-4">
            <div>
              <span className="font-editorial-mono text-xs font-bold tracking-widest uppercase text-[var(--oxblood)]">
                Table of Contents
              </span>
              <h3 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
                The Contemporary Anthology
              </h3>
            </div>

            {/* Living Interactive Filter */}
            <div className="flex flex-wrap items-center gap-1.5 font-editorial-mono text-[10px] tracking-wider uppercase">
              {["ALL", "SYSTEMS CRAFT", "LITERARY ECOLOGY", "DIGITAL THEORY"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    selectedCategory === cat
                      ? "bg-[var(--oxblood)] text-white font-bold"
                      : "bg-[var(--paper-card)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--paper-border)]"
                  }`}
                >
                  {cat === "ALL" ? "All Subjects" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {filteredAnthology.map((story) => (
              <article
                key={story.slug}
                className="paper-sheet group flex flex-col justify-between rounded-xl p-6 transition-all"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between font-editorial-mono text-[11px] text-[var(--ink-muted)]">
                    <span className="font-semibold text-[var(--oxblood)]">{story.chapter}</span>
                    <span>{story.folio}</span>
                  </div>

                  <Link href={`/read/${story.slug}`}>
                    <h4 className="font-editorial-serif text-xl font-bold leading-snug text-[var(--ink-primary)] transition-colors group-hover:text-[var(--oxblood)]">
                      {story.title}
                    </h4>
                  </Link>

                  <p className="mt-3 line-clamp-3 font-editorial-serif text-sm leading-relaxed text-[var(--ink-secondary)]">
                    {story.excerpt}
                  </p>
                </div>

                <div className="mt-6 border-t border-[var(--editorial-rule)] pt-4 font-editorial-sans text-xs">
                  <div className="flex items-center justify-between text-[var(--ink-muted)]">
                    <div>
                      <p className="font-semibold text-[var(--ink-primary)]">{story.author}</p>
                      <p className="text-[10px]">{story.role}</p>
                    </div>
                    <span className="font-editorial-mono text-[11px]">{story.readingTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Bound Collections / Slipcase Editions */}
        <section className="my-16 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-card)] p-8 sm:p-10 shadow-xs">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="font-editorial-mono text-xs font-bold tracking-widest uppercase text-[var(--oxblood)]">
                Archive Collections
              </span>
              <h3 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                Thematic Slipcases &amp; Volumes
              </h3>
            </div>
            <BookOpen className="h-5 w-5 text-[var(--oxblood)]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {CURATED_VOLUMES.map((vol) => (
              <div
                key={vol.number}
                className="rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-5 transition-transform hover:-translate-y-1 hover:border-[var(--oxblood)] shadow-xs"
              >
                <div className="font-editorial-mono text-[10px] tracking-widest uppercase text-[var(--amber-gold)] font-bold">
                  {vol.number}
                </div>
                <h5 className="mt-1 font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                  {vol.title}
                </h5>
                <p className="mt-2 text-xs text-[var(--ink-secondary)] leading-relaxed">
                  {vol.tagline}
                </p>
                <div className="mt-4 font-editorial-mono text-[10px] tracking-wider text-[var(--ink-muted)] uppercase">
                  {vol.count}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Classical Book Colophon / Footer */}
      <footer className="border-t border-[var(--editorial-rule)] bg-[var(--paper-surface)] py-12 px-4 text-center font-editorial-mono text-xs text-[var(--ink-muted)]">
        <div className="mx-auto max-w-2xl space-y-3">
          <p className="tracking-widest uppercase text-[var(--ink-primary)] font-bold">
            I N K F O R G E • C O L O P H O N
          </p>
          <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)]">
            Set in digital Charter and classical typography algorithms. Bound with modern React and Next.js.
          </p>
          <p className="text-[11px] text-[var(--ink-muted)]">
            Designed for long-horizon reading, authorial sovereignty, and intellectual delight.
          </p>
        </div>
      </footer>
    </div>
  );
}

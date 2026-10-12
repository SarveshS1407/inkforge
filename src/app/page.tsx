"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { InkforgeLanding } from "@/components/landing/InkforgeLanding";

interface AnthologyStory {
  slug: string;
  category: string;
  chapter: string;
  folio: string;
  title: string;
  excerpt: string;
  author: string;
  role: string;
  date: string;
  readingTime: string;
  publication: string;
}
import {
  BookOpen,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
  Feather,
  Bookmark,
  Compass,
  Quote,
} from "lucide-react";

const LEAD_ESSAY = {
  slug: "crafting-systems-that-endure",
  chapter: "CHAPTER I",
  folio: "FOLIO 14–28",
  issue: "ISSUE IV • AUTUMN 2026",
  title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
  subtitle: "On permanence, architectural discipline, and treating digital constructs with the gravity of literature.",
  author: "Elena Rostova",
  role: "Chair of Architectural Studies",
  readingTime: "6 min read",
  publication: "Architecture & Craft",
  excerpt:
    "Software engineering suffers from a pervasive bias toward the ephemeral. We measure velocity by story points burned in two-week sprints, celebrate migrations that will be reversed eighteen months later, and obsess over frameworks whose lifespans rarely outlast an oak leaf. Yet there exists another lineage in software — one rooted in permanence.",
};

const DISPATCHES = [
  {
    title: "On the Permanence of the Relational Calculus",
    date: "TODAY • 09:30",
    author: "Elena Rostova",
    tag: "DISPATCH",
  },
  {
    title: "The Typography of Ambient E-Ink Surfaces",
    date: "YESTERDAY • 16:15",
    author: "David Vance",
    tag: "NOTE",
  },
  {
    title: "Why Independent Digital Gardens Outlive Social Feeds",
    date: "OCT 6 • 11:00",
    author: "Marcus Chen",
    tag: "ESSAY",
  },
];

const ANTHOLOGY_STORIES = [
  {
    slug: "the-death-and-rebirth-of-the-independent-web",
    category: "LITERARY ECOLOGY",
    chapter: "CHAPTER II",
    folio: "pp. 29–38",
    title: "The Rebirth of the Independent Web: Why Writers Are Leaving Algorithmic Silos",
    excerpt:
      "Feeds incentivize outrage and decay attention. A new renaissance of dedicated publications, newsletters, and bespoke digital spaces is quietly reclaiming the sovereign written word.",
    author: "Marcus Chen",
    role: "Editorial Essayist",
    date: "Autumn 2026",
    readingTime: "4 min read",
    publication: "Digital Ecology",
  },
  {
    slug: "block-based-composition-in-modern-publishing",
    category: "SYSTEMS CRAFT",
    chapter: "CHAPTER III",
    folio: "pp. 39–54",
    title: "The Architecture of Block Composition: From ProseMirror ASTs to Dynamic Canvases",
    excerpt:
      "How decoupling content blocks from rigid HTML structures unlocks programmable narratives, responsive media embeds, and effortless multi-format syndication across print and digital mediums.",
    author: "David Vance",
    role: "Principal Frontend Engineer",
    date: "Autumn 2026",
    readingTime: "8 min read",
    publication: "Inkforge Engineering",
  },
  {
    slug: "notes-on-local-first-autosave",
    category: "DIGITAL THEORY",
    chapter: "DISPATCH IV",
    folio: "pp. 55–64",
    title: "The Scribe's Sanctuary: Local-First Draft Persistence in Uncertain Networks",
    excerpt:
      "An exploration of resilient state architectures that guarantee no author ever loses a syllable, even during network turbulence or power failure.",
    author: "Sarah Lindqvist",
    role: "Staff Fellow",
    date: "Autumn 2026",
    readingTime: "5 min read",
    publication: "Systems & Theory",
  },
];

const CURATED_VOLUMES = [
  {
    number: "VOL. I",
    title: "On Craft & Systems",
    count: "12 Monographs",
    tagline: "Foundational treatises on endurance, architecture, and enduring tool design.",
    color: "border-[var(--oxblood)]/40",
  },
  {
    number: "VOL. II",
    title: "The Sovereign Writer",
    count: "8 Monographs",
    tagline: "Essays exploring independent distribution, personal archives, and literary autonomy.",
    color: "border-[var(--amber-gold)]/40",
  },
  {
    number: "VOL. III",
    title: "Block Semantics & Type",
    count: "15 Monographs",
    tagline: "The marriage of classical typography algorithms and living digital canvases.",
    color: "border-[var(--forest)]/40",
  },
];

export default function HomePage() {
  const [anthology, setAnthology] = useState<AnthologyStory[]>(ANTHOLOGY_STORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    let isMounted = true;
    async function loadPublished() {
      try {
        const res = await fetch("/api/v1/documents?status=PUBLISHED&limit=10");
        if (!res.ok) return;
        const json = await res.json();
        if (!isMounted || !json.success || !Array.isArray(json.data)) return;

        const dbStories: AnthologyStory[] = json.data.map((item: any, idx: number) => ({
          slug: item.slug,
          category: "SYSTEMS CRAFT",
          chapter: `FOLIO ${idx + 1}`,
          folio: "INSCRIBED",
          title: item.title,
          excerpt:
            item.excerpt ||
            (item.contentHtml
              ? item.contentHtml.replace(/<[^>]+>/g, "").slice(0, 160) + "..."
              : "A recently inscribed monograph published on Inkforge."),
          author: item.author?.displayName || item.author?.username || "Resident Author",
          role: "Published Author",
          date: item.publishedAt
            ? new Date(item.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })
            : "Autumn 2026",
          readingTime: "4 min read",
          publication: "Inkforge Press",
        }));

        const seen = new Set<string>();
        const combined: AnthologyStory[] = [];
        for (const s of [...dbStories, ...ANTHOLOGY_STORIES]) {
          if (!seen.has(s.slug)) {
            seen.add(s.slug);
            combined.push(s);
          }
        }
        setAnthology(combined);
      } catch (err) {
        console.warn("Could not fetch published documents for Homepage:", err);
      }
    }

    loadPublished();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAnthology = anthology.filter(
    (story) => selectedCategory === "ALL" || story.category === selectedCategory
  );

  return (
    <InkforgeLanding>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Curated Publication Frontispiece Ribbon */}
        <section className="border-b border-[var(--editorial-rule)] pb-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-editorial-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[var(--oxblood)]">AUTUMN ANTHOLOGY</span>
              <span>•</span>
              <span>VOLUME IV COMPILATION</span>
              <span>•</span>
              <span className="hidden md:inline">CURATED MONOGRAPHS &amp; DISPATCHES</span>
            </div>
            <div className="text-[11px] text-[var(--oxblood)] font-bold tracking-wider">
              CURRENT EDITION
            </div>
          </div>
        </section>

        {/* Lead Feature & Editorial Gazetteer (Split 7 / 5 Grid) */}
        <section className="my-14 grid gap-8 lg:grid-cols-12 items-start">
          {/* Main Book-Jacket Lead Story (7 cols) */}
          <div className="lg:col-span-8 book-jacket rounded-xl p-8 sm:p-10">
            {/* Silk Bookmark Ribbon */}
            <div className="book-ribbon" />

            <div className="mb-4 flex items-center justify-between font-editorial-mono text-[11px] tracking-widest uppercase text-[var(--ink-muted)]">
              <span className="font-bold text-[var(--oxblood)]">
                {LEAD_ESSAY.chapter} • {LEAD_ESSAY.publication}
              </span>
              <span>{LEAD_ESSAY.folio}</span>
            </div>

            <Link href={`/read/${LEAD_ESSAY.slug}`} className="group block">
              <h2 className="font-editorial-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink-primary)] transition-colors group-hover:text-[var(--oxblood)] leading-tight">
                {LEAD_ESSAY.title}
              </h2>
            </Link>

            <p className="mt-4 font-editorial-serif text-lg text-[var(--ink-secondary)] italic leading-relaxed">
              {LEAD_ESSAY.subtitle}
            </p>

            {/* Opening Drop-Cap Paragraph */}
            <div className="mt-6 border-t border-[var(--editorial-rule)] pt-6">
              <p className="drop-cap font-editorial-serif text-base sm:text-lg leading-[1.88] text-[var(--ink-secondary)]">
                {LEAD_ESSAY.excerpt}
              </p>
            </div>

            {/* Author Byline & Folio Details */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--editorial-rule)] pt-5 font-editorial-sans text-xs text-[var(--ink-muted)]">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--paper-warm)] border border-[var(--paper-border)] font-editorial-serif font-bold text-sm text-[var(--oxblood)]">
                  {LEAD_ESSAY.author[0]}
                </div>
                <div>
                  <p className="font-semibold text-[var(--ink-primary)]">{LEAD_ESSAY.author}</p>
                  <p className="text-[11px] text-[var(--ink-muted)]">{LEAD_ESSAY.role}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 font-editorial-mono text-[11px]">
                <span>{LEAD_ESSAY.issue}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{LEAD_ESSAY.readingTime}</span>
                </span>
                <span>•</span>
                <Link
                  href={`/read/${LEAD_ESSAY.slug}`}
                  className="font-bold text-[var(--oxblood)] hover:underline uppercase inline-flex items-center gap-1"
                >
                  <span>Open Book</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Gazetteer & Dispatches (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* The Daily Gazetteer Box */}
            <div className="paper-sheet rounded-xl p-6">
              <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3">
                <span className="font-editorial-mono text-xs font-bold uppercase tracking-widest text-[var(--oxblood)]">
                  Gazetteer Dispatches
                </span>
                <Feather className="h-4 w-4 text-[var(--amber-gold)]" />
              </div>

              <div className="mt-4 divide-y divide-[var(--editorial-rule)]">
                {DISPATCHES.map((d, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                      <span className="text-[var(--oxblood)] font-bold">{d.tag}</span>
                      <span>{d.date}</span>
                    </div>
                    <Link
                      href="/discover"
                      className="block group/dispatch focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] rounded-xs"
                    >
                      <h5 className="mt-1 font-editorial-serif text-sm font-bold leading-snug text-[var(--ink-primary)] group-hover/dispatch:text-[var(--oxblood)] transition-colors">
                        {d.title}
                      </h5>
                    </Link>
                    <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">By {d.author}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote of the Issue */}
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-6">
              <Quote className="h-5 w-5 text-[var(--oxblood)] mb-2" />
              <blockquote className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] leading-relaxed">
                &ldquo;Enduring software is not static software; it is software whose foundations are sturdy enough that evolution feels like growth rather than replacement.&rdquo;
              </blockquote>
              <div className="mt-3 font-editorial-mono text-[10px] tracking-wider text-[var(--ink-muted)] uppercase">
                — Issue IV Editorial Preface
              </div>
            </div>
          </div>
        </section>

        {/* Ornamental Book Divider */}
        <div className="editorial-divider">
          <span>✦ • ✦</span>
        </div>

        {/* The Contemporary Anthology Section */}
        <section className="my-14">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[var(--editorial-rule)] pb-4 gap-4">
            <div>
              <span className="font-editorial-mono text-xs font-bold tracking-widest uppercase text-[var(--oxblood)]">
                Curated Monographs
              </span>
              <h3 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
                The Contemporary Anthology
              </h3>
            </div>

            {/* Living Interactive Filter */}
            <div className="flex flex-wrap items-center gap-1.5 font-editorial-mono text-[10px] tracking-wider uppercase" role="group" aria-label="Subject filter">
              {["ALL", "SYSTEMS CRAFT", "LITERARY ECOLOGY", "DIGITAL THEORY"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] ${
                    selectedCategory === cat
                      ? "bg-[var(--oxblood)] text-white font-bold"
                      : "bg-[var(--paper-warm)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--paper-border)]"
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
                className="book-jacket group flex flex-col justify-between rounded-xl p-6 transition-all"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between font-editorial-mono text-[11px] text-[var(--ink-muted)]">
                    <span className="font-semibold text-[var(--oxblood)]">{story.chapter}</span>
                    <span>{story.folio}</span>
                  </div>

                  <Link href={`/read/${story.slug}`} className="focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] rounded-xs">
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

        {/* Bound Collections / Slipcase Boxsets */}
        <section className="my-16 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-8 sm:p-10 shadow-xs">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="font-editorial-mono text-xs font-bold tracking-widest uppercase text-[var(--oxblood)]">
                Archive Collections
              </span>
              <h3 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                Thematic Slipcases &amp; Bound Volumes
              </h3>
            </div>
            <Link
              href="/collections"
              className="text-xs font-editorial-mono uppercase tracking-wider text-[var(--oxblood)] hover:underline inline-flex items-center space-x-1 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] rounded-xs"
            >
              <span>View All Collections</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {CURATED_VOLUMES.map((vol) => (
              <Link
                key={vol.number}
                href="/collections"
                className={`block rounded-lg border bg-[var(--paper-surface)] p-5 transition-transform hover:-translate-y-1 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] ${vol.color}`}
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
              </Link>
            ))}
          </div>
        </section>

        {/* Platform Almanac / The Scribe Ledger Stats */}
        <section className="my-16 border-t border-[var(--editorial-rule)] pt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center font-editorial-mono">
            <div className="p-4 rounded-lg bg-[var(--paper-surface)] border border-[var(--paper-border)]">
              <div className="text-2xl font-bold font-editorial-serif text-[var(--oxblood)]">
                38
              </div>
              <div className="mt-1 text-[10px] tracking-wider uppercase text-[var(--ink-muted)]">
                Monographs Bound
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--paper-surface)] border border-[var(--paper-border)]">
              <div className="text-2xl font-bold font-editorial-serif text-[var(--ink-primary)]">
                142k
              </div>
              <div className="mt-1 text-[10px] tracking-wider uppercase text-[var(--ink-muted)]">
                Words Inscribed
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--paper-surface)] border border-[var(--paper-border)]">
              <div className="text-2xl font-bold font-editorial-serif text-[var(--amber-gold)]">
                100%
              </div>
              <div className="mt-1 text-[10px] tracking-wider uppercase text-[var(--ink-muted)]">
                Local Autosave Fidelity
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--paper-surface)] border border-[var(--paper-border)]">
              <div className="text-2xl font-bold font-editorial-serif text-[var(--forest)]">
                2035+
              </div>
              <div className="mt-1 text-[10px] tracking-wider uppercase text-[var(--ink-muted)]">
                Archival Horizon
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Classical Master Colophon */}
      <footer className="border-t border-[var(--editorial-rule)] bg-[var(--paper-surface)] py-14 px-4 text-center font-editorial-mono text-xs text-[var(--ink-muted)]">
        <div className="mx-auto max-w-2xl space-y-3">
          <p className="tracking-widest uppercase text-[var(--ink-primary)] font-bold">
            I N K F O R G E • P U B L I S H I N G • H O U S E
          </p>
          <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)]">
            Typeset in digital Charter with classical layout algorithms. Pressed on modern React and Next.js foundations.
          </p>
          <p className="text-[10px] text-[var(--ink-muted)] tracking-wider uppercase">
            A Living Digital Book • Continuous Edition • All Rights Preserved
          </p>
        </div>
      </footer>
    </InkforgeLanding>
  );
}

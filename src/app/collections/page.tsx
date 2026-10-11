"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import {
  Layers,
  BookOpen,
  ArrowRight,
  Clock,
  Feather,
  Bookmark,
  CheckCircle2,
} from "lucide-react";

interface CollectionItem {
  id: string;
  volumeNumber: string;
  title: string;
  tagline: string;
  description: string;
  monographCount: number;
  clothColor: string;
  stories: {
    slug: string;
    title: string;
    author: string;
    readingTime: string;
  }[];
}

const COLLECTIONS: CollectionItem[] = [
  {
    id: "craft-and-systems",
    volumeNumber: "VOL. I",
    title: "On Craft & Systems",
    tagline: "Foundational treatises on software endurance, architecture, and enduring tool design.",
    description:
      "A curated anthology exploring how digital systems can inherit the longevity, care, and architectural discipline of stone cathedrals and classical literature.",
    monographCount: 12,
    clothColor: "border-[var(--oxblood)]/60 bg-[var(--oxblood)]/5",
    stories: [
      {
        slug: "crafting-systems-that-endure",
        title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
        author: "Elena Rostova",
        readingTime: "6 min read",
      },
      {
        slug: "block-based-composition-in-modern-publishing",
        title: "The Architecture of Block Composition: From ProseMirror ASTs to Dynamic Canvases",
        author: "David Vance",
        readingTime: "8 min read",
      },
      {
        slug: "notes-on-local-first-autosave",
        title: "The Scribe's Sanctuary: Local-First Draft Persistence in Uncertain Networks",
        author: "Sarah Lindqvist",
        readingTime: "5 min read",
      },
    ],
  },
  {
    id: "the-sovereign-writer",
    volumeNumber: "VOL. II",
    title: "The Sovereign Writer",
    tagline: "Essays exploring independent distribution, personal archives, and literary autonomy.",
    description:
      "Examining the departure from algorithmic engagement treadmills toward dedicated digital gardens, decentralized syndication, and intimate reader relationships.",
    monographCount: 8,
    clothColor: "border-[var(--amber-gold)]/60 bg-[var(--amber-gold)]/5",
    stories: [
      {
        slug: "the-death-and-rebirth-of-the-independent-web",
        title: "The Rebirth of the Independent Web: Why Writers Are Leaving Algorithmic Silos",
        author: "Marcus Chen",
        readingTime: "4 min read",
      },
      {
        slug: "crafting-systems-that-endure",
        title: "The Solitude of the Long-Horizon Essayist",
        author: "Elena Rostova",
        readingTime: "7 min read",
      },
    ],
  },
  {
    id: "block-semantics-and-type",
    volumeNumber: "VOL. III",
    title: "Block Semantics & Type",
    tagline: "The marriage of classical typography algorithms and living digital canvases.",
    description:
      "Investigating font rendering engines, micro-typography on retina and ambient e-ink screens, and how structural AST blocks empower multi-format publishing.",
    monographCount: 15,
    clothColor: "border-[var(--forest)]/60 bg-[var(--forest)]/5",
    stories: [
      {
        slug: "block-based-composition-in-modern-publishing",
        title: "From Woodblock to CSS Grid: The Evolution of Page Geometry",
        author: "David Vance",
        readingTime: "8 min read",
      },
      {
        slug: "notes-on-local-first-autosave",
        title: "The Typography of Ambient E-Ink Surfaces",
        author: "David Vance",
        readingTime: "5 min read",
      },
    ],
  },
  {
    id: "digital-ecology",
    volumeNumber: "VOL. IV",
    title: "Digital Ecology & Solitude",
    tagline: "Quiet spaces for contemplation, slow computing, and calm digital environments.",
    description:
      "How to reclaim human attention from aggressive notification loops and build digital environments that feel like serene reading libraries.",
    monographCount: 9,
    clothColor: "border-[var(--oxblood)]/40 bg-[var(--paper-warm)]",
    stories: [
      {
        slug: "the-death-and-rebirth-of-the-independent-web",
        title: "Why Independent Digital Gardens Outlive Social Feeds",
        author: "Marcus Chen",
        readingTime: "4 min read",
      },
      {
        slug: "crafting-systems-that-endure",
        title: "On the Permanence of the Relational Calculus",
        author: "Elena Rostova",
        readingTime: "6 min read",
      },
    ],
  },
];

export default function CollectionsPage() {
  const [activeCollectionId, setActiveCollectionId] = useState<string>(COLLECTIONS[0].id);

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
          <span className="text-[var(--oxblood)] font-bold">Curated Collections</span>
        </div>

        {/* Masthead */}
        <header className="border-b border-[var(--editorial-rule)] pb-10 mb-10">
          <div className="inline-flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] mb-3 font-bold">
            <Layers className="h-4 w-4" />
            <span>Thematic Folios</span>
          </div>
          <h1 className="font-editorial-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.12]">
            Curated Collections
          </h1>
          <p className="font-editorial-serif text-lg text-[var(--ink-secondary)] italic mt-3 max-w-2xl">
            Explore monographs, essays, and treatises organized around enduring ideas and publishing traditions.
          </p>
        </header>

        {/* Collections Grid */}
        <section className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Collection Selector Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <span className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold block mb-2">
              Select an Anthology
            </span>

            {COLLECTIONS.map((col) => {
              const isSelected = activeCollectionId === col.id;

              return (
                <div
                  key={col.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => setActiveCollectionId(col.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveCollectionId(col.id);
                    }
                  }}
                  className={`group relative rounded-xl border p-5 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] ${
                    isSelected
                      ? "border-[var(--oxblood)] bg-[var(--paper-surface)] shadow-md ring-1 ring-[var(--oxblood)]"
                      : "border-[var(--paper-border)] bg-[var(--paper-surface)]/60 hover:border-[var(--oxblood)]/50 hover:bg-[var(--paper-surface)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 font-editorial-mono text-[10px] uppercase tracking-widest">
                    <span className="text-[var(--oxblood)] font-bold">{col.volumeNumber}</span>
                    <span className="text-[var(--ink-muted)]">{col.monographCount} Works</span>
                  </div>

                  <h3 className="font-editorial-serif text-xl font-bold text-[var(--ink-primary)]">
                    {col.title}
                  </h3>

                  <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)] mt-1 line-clamp-2">
                    {col.tagline}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Collection Detail & Reading List (7 cols) */}
          <div className="lg:col-span-7">
            {COLLECTIONS.filter((c) => c.id === activeCollectionId).map((col) => (
              <div
                key={col.id}
                className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8 space-y-6 shadow-xs animate-fade-in"
              >
                <div>
                  <div className="flex items-center justify-between font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] font-bold mb-2">
                    <span>{col.volumeNumber} ANTHOLOGY</span>
                    <span className="text-[var(--ink-muted)] font-normal">
                      {col.monographCount} Monographs
                    </span>
                  </div>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
                    {col.title}
                  </h2>
                  <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] mt-3 leading-relaxed">
                    {col.description}
                  </p>
                </div>

                <div className="border-t border-[var(--editorial-rule)] pt-6 space-y-4">
                  <span className="font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-bold block">
                    Featured Monographs in this Collection
                  </span>

                  <div className="space-y-3">
                    {col.stories.map((story, idx) => (
                      <Link
                        key={idx}
                        href={`/read/${story.slug}`}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-canvas)] transition-all hover:border-[var(--oxblood)] hover:shadow-xs"
                      >
                        <div className="space-y-1">
                          <h4 className="font-editorial-serif font-bold text-sm sm:text-base text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors line-clamp-1">
                            {story.title}
                          </h4>
                          <span className="font-editorial-sans text-xs text-[var(--ink-muted)]">
                            By {story.author}
                          </span>
                        </div>

                        <div className="mt-2 sm:mt-0 flex items-center space-x-3 text-xs font-editorial-mono text-[var(--ink-muted)] shrink-0">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{story.readingTime}</span>
                          </span>
                          <span className="font-editorial-sans text-[var(--oxblood)] font-semibold inline-flex items-center group-hover:translate-x-1 transition-transform">
                            Read →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Footnote */}
                <div className="border-t border-[var(--editorial-rule)] pt-4 flex items-center justify-between font-editorial-mono text-[10px] uppercase text-[var(--ink-muted)]">
                  <span>Continuous Press Archives</span>
                  <Link href="/write" className="text-[var(--oxblood)] hover:underline">
                    Submit work to this collection →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

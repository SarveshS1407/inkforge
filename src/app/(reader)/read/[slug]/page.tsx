import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { ArrowLeft, Clock, Calendar, BookOpen, Bookmark, Share2 } from "lucide-react";

interface Story {
  slug: string;
  chapter: string;
  folio: string;
  title: string;
  subtitle: string;
  author: string;
  role: string;
  date: string;
  readingTime: string;
  publication: string;
  content: string[];
  pullquote?: string;
  footnotes?: { id: number; text: string }[];
}

const STORIES: Record<string, Story> = {
  "crafting-systems-that-endure": {
    slug: "crafting-systems-that-endure",
    chapter: "CHAPTER I",
    folio: "FOLIO 14–28",
    title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
    subtitle: "On permanence, architectural discipline, and treating digital constructs with the gravity of literature.",
    author: "Elena Rostova",
    role: "Chair of Architectural Studies",
    date: "October 6, 2026",
    readingTime: "6 min read",
    publication: "Architecture & Craft",
    content: [
      "Software engineering suffers from a pervasive bias toward the ephemeral. We measure velocity by story points burned in two-week sprints, celebrate migrations that will be reversed eighteen months later, and obsess over frameworks whose lifespans rarely outlast an oak leaf.",
      "Yet there exists another lineage in software — one rooted in permanence. The programs written by Ken Thompson, the relational calculus formalised by Edgar Codd, and the typography algorithms crafted by Donald Knuth share a peculiar grace: they endure not despite change, but because their core abstractions were grounded in enduring truths.",
      "When we began designing Inkforge, we asked ourselves a foundational question: What would a publishing engine look like if it were built with the discipline of a cathedral rather than a billboard?",
      "The answer started with block composition. Instead of locking prose into opaque HTML blobs or proprietary database records, we treat content as an Abstract Syntax Tree of semantic blocks. Every heading, every code snippet, every blockquote, and every interactive graph is an immutable atomic token of expression.",
      "By decoupling authoring semantics from display mediums, we ensure that an essay written today can be read on an ambient e-ink display in 2035, parsed into structured knowledge graphs, or republished across decentralized feeds without losing a shred of typographic intention.",
      "Enduring software is not static software; it is software whose foundations are sturdy enough that evolution feels like growth rather than replacement.",
    ],
    pullquote: "The truest software architecture mirrors literature: thoughtful, disciplined, and designed for decades.",
    footnotes: [
      { id: 1, text: "Donald Knuth, Computers & Typesetting, Vol. A: The TeXbook (Addison-Wesley, 1984)." },
      { id: 2, text: "Edgar F. Codd, 'A Relational Model of Data for Large Shared Data Banks', CACM 13(6), 1970." },
    ],
  },
  "the-death-and-rebirth-of-the-independent-web": {
    slug: "the-death-and-rebirth-of-the-independent-web",
    chapter: "CHAPTER II",
    folio: "FOLIO 29–38",
    title: "The Rebirth of the Independent Web: Why Writers Are Leaving Algorithmic Silos",
    subtitle: "How dedicated publications and sovereign digital spaces are reclaiming the dignity of the written word.",
    author: "Marcus Chen",
    role: "Editorial Essayist",
    date: "October 5, 2026",
    readingTime: "4 min read",
    publication: "Digital Ecology",
    content: [
      "The promise of the early social web was democratic distribution. The reality twenty years later is algorithmic homogenisation.",
      "When content is mediated by platforms whose primary incentive is advertising impression density, nuanced prose cannot survive. Writers are trained to optimize for provocation rather than depth, for click-through immediacy rather than resonance.",
      "What we are witnessing today is not the decline of reading, but the quiet migration of discerning readers toward independent digital gardens.",
      "Inkforge provides writers and editorial cooperatives with sovereign digital spaces: high-performance reading surfaces that respect the reader's attention span and elevate writing back to literature.",
    ],
    pullquote: "Discerning readers are quietly migrating away from engagement loops toward independent digital gardens.",
  },
  "block-based-composition-in-modern-publishing": {
    slug: "block-based-composition-in-modern-publishing",
    chapter: "CHAPTER III",
    folio: "FOLIO 39–54",
    title: "The Architecture of Block Composition: From ProseMirror ASTs to Dynamic Canvases",
    subtitle: "Decoupling narrative intent from rendering mediums for expressive, multi-format publishing.",
    author: "David Vance",
    role: "Principal Frontend Engineer",
    date: "October 3, 2026",
    readingTime: "8 min read",
    publication: "Inkforge Engineering",
    content: [
      "A publishing engine is only as good as its content model. In this technical deep-dive, we examine how Inkforge leverages ProseMirror schemas and Tiptap extensions to construct a zero-friction authoring canvas.",
      "Traditional rich-text editors produce messy, unpredictable HTML payloads littered with inline styles. In Inkforge, every document is serialized into a clean JSON document tree.",
      "This separation allows real-time collaborative editing, granular version diffing, and automated transforms into multiple output formats including clean HTML, Markdown, and syndication feeds.",
    ],
    pullquote: "A document tree should be an expressive abstract canvas, not a fragile bundle of tags.",
  },
};

export default async function StoryReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = STORIES[slug] || {
    slug,
    chapter: "MANUSCRIPT",
    folio: "FOLIO ARCHIVE",
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    subtitle: "A monograph from the Inkforge Studio archive.",
    author: "Inkforge Author",
    role: "Staff Contributor",
    date: "Recent Edition",
    readingTime: "3 min read",
    publication: "The Collective",
    content: [
      "This piece was authored and published via the Inkforge Writer Studio. Explore the studio to create and publish your own stories with living editorial typography.",
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--paper-bg)] text-[var(--ink-primary)]">
      <Header />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Navigation & Chapter Folio */}
        <div className="mb-8 flex items-center justify-between border-b border-[var(--editorial-rule)] pb-4 font-editorial-mono text-xs tracking-widest uppercase text-[var(--ink-muted)]">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 transition-colors hover:text-[var(--oxblood)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Index</span>
          </Link>

          <span>
            {story.chapter} • {story.folio}
          </span>
        </div>

        {/* Header Section */}
        <header className="mb-10 text-center sm:text-left">
          <div className="mb-3">
            <span className="font-editorial-mono text-xs font-bold tracking-widest uppercase text-[var(--oxblood)]">
              {story.publication}
            </span>
          </div>

          <h1 className="font-editorial-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.12]">
            {story.title}
          </h1>

          <p className="mt-5 font-editorial-serif text-lg sm:text-xl text-[var(--ink-secondary)] italic leading-relaxed">
            {story.subtitle}
          </p>

          {/* Byline and Reading Folio */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--editorial-rule)] py-4 font-editorial-sans text-xs text-[var(--ink-muted)]">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--paper-card)] border border-[var(--paper-border)] font-editorial-serif font-bold text-sm text-[var(--oxblood)]">
                {story.author[0]}
              </div>
              <div>
                <p className="font-semibold text-[var(--ink-primary)]">{story.author}</p>
                <p className="text-[11px] text-[var(--ink-muted)]">{story.role}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 font-editorial-mono text-[11px]">
              <span>{story.date}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{story.readingTime}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Prose Content */}
        <div className="space-y-6 font-editorial-serif text-lg leading-[1.88] text-[var(--ink-primary)]">
          {story.content.map((paragraph, idx) => (
            <p
              key={idx}
              className={idx === 0 ? "drop-cap" : ""}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Pullquote if available */}
        {story.pullquote && (
          <blockquote className="editorial-pullquote my-10">
            &ldquo;{story.pullquote}&rdquo;
          </blockquote>
        )}

        {/* Editorial Section Divider */}
        <div className="editorial-divider my-12">
          <span>✦ • ✦</span>
        </div>

        {/* Footnotes Section if available */}
        {story.footnotes && (
          <div className="my-10 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-card)] p-6 font-editorial-sans text-xs text-[var(--ink-secondary)]">
            <h4 className="font-editorial-mono font-bold uppercase tracking-wider text-[var(--oxblood)] mb-3">
              Footnotes &amp; Critical References
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5">
              {story.footnotes.map((fn) => (
                <li key={fn.id} className="leading-relaxed">
                  {fn.text}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Author Colophon Box */}
        <footer className="mt-14 rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8">
          <div className="flex items-start space-x-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--oxblood)] text-white font-editorial-serif font-bold text-lg">
              {story.author[0]}
            </div>
            <div className="space-y-1">
              <h4 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                About the Author
              </h4>
              <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] leading-relaxed">
                {story.author} serves as {story.role} at {story.publication}. Their work explores the intersection of literature, system design, and the digital public square.
              </p>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}

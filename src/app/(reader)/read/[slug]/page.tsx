import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/navigation/Header";
import { ArrowLeft, Clock, Calendar, Bookmark, Share2 } from "lucide-react";

interface Story {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  role: string;
  date: string;
  readingTime: string;
  publication: string;
  content: string[];
}

const STORIES: Record<string, Story> = {
  "crafting-systems-that-endure": {
    slug: "crafting-systems-that-endure",
    title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
    excerpt: "Modern engineering often rushes to ship ephemeral features. But the truest software architecture mirrors literature: thoughtful, disciplined, and designed for decades.",
    author: "Elena Rostova",
    role: "Lead Systems Architect",
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
  },
  "the-death-and-rebirth-of-the-independent-web": {
    slug: "the-death-and-rebirth-of-the-independent-web",
    title: "The Rebirth of the Independent Web: Why Writers Are Leaving Algorithmic Silos",
    excerpt: "Feeds incentivize outrage and decay attention. A new renaissance of dedicated publications, newsletters, and bespoke digital spaces is quietly reclaiming the written word.",
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
  },
  "block-based-composition-in-modern-publishing": {
    slug: "block-based-composition-in-modern-publishing",
    title: "The Architecture of Block Composition: From ProseMirror ASTs to Dynamic Canvases",
    excerpt: "How decoupling content blocks from rigid HTML structures unlocks programmable narratives, responsive media embeds, and effortless multi-format syndication.",
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
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    excerpt: "An archival story published through the Inkforge studio.",
    author: "Inkforge Author",
    role: "Staff Contributor",
    date: "Recent",
    readingTime: "3 min read",
    publication: "Inkforge Collective",
    content: [
      "This piece was authored and published via the Inkforge Writer Studio. Explore the studio to create and publish your own stories.",
    ],
  };

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#f1f2f4]">
      <Header />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center space-x-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-amber-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </Link>

        {/* Publication banner */}
        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            {story.publication}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-serif text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          {story.title}
        </h1>

        {/* Subtitle / Excerpt */}
        <p className="mt-4 text-lg leading-relaxed text-zinc-400 sm:text-xl">
          {story.excerpt}
        </p>

        {/* Meta Bar */}
        <div className="my-8 flex flex-wrap items-center justify-between border-y border-zinc-800/80 py-4 text-xs text-zinc-400">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-black font-serif font-bold text-sm">
              {story.author[0]}
            </div>
            <div>
              <p className="font-semibold text-white">{story.author}</p>
              <p className="text-[11px] text-zinc-500">{story.role}</p>
            </div>
          </div>

          <div className="mt-2 flex items-center space-x-4 sm:mt-0">
            <span className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{story.date}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{story.readingTime}</span>
            </span>
          </div>
        </div>

        {/* Story Body */}
        <div className="space-y-6 font-serif text-lg leading-[1.85] text-zinc-300">
          {story.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {/* Author Footer Card */}
        <div className="mt-16 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8">
          <div className="flex items-start space-x-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-black font-serif font-bold text-lg">
              {story.author[0]}
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-base font-bold text-white">Written by {story.author}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Contributing editor at {story.publication}. Writing on system design, modern typography, and the evolving digital public square.
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

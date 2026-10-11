"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/navigation/Header";
import { useEdition } from "@/components/theme/EditionContext";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  BookOpen,
  Share2,
  Check,
  Bookmark,
  BookmarkCheck,
  Maximize2,
  Minimize2,
  Compass,
} from "lucide-react";

interface Story {
  slug: string;
  chapter: string;
  folio: string;
  issue: string;
  title: string;
  subtitle: string;
  author: string;
  role: string;
  date: string;
  readingTime: string;
  readingMinutesTotal: number;
  publication: string;
  content: string[];
  pullquote?: string;
  footnotes?: { id: number; text: string; sideNote?: string }[];
  nextStory?: { slug: string; title: string; chapter: string };
}

const STORIES: Record<string, Story> = {
  "crafting-systems-that-endure": {
    slug: "crafting-systems-that-endure",
    chapter: "CHAPTER I",
    folio: "FOLIO 14–28",
    issue: "ISSUE IV • AUTUMN 2026",
    title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
    subtitle: "On permanence, architectural discipline, and treating digital constructs with the gravity of literature.",
    author: "Elena Rostova",
    role: "Chair of Architectural Studies",
    date: "October 6, 2026",
    readingTime: "6 min read",
    readingMinutesTotal: 6,
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
      { id: 1, text: "Donald Knuth, Computers & Typesetting, Vol. A: The TeXbook (Addison-Wesley, 1984).", sideNote: "Knuth's TeX algorithm achieved version 3.141592653, asymptotically approaching π." },
      { id: 2, text: "Edgar F. Codd, 'A Relational Model of Data for Large Shared Data Banks', CACM 13(6), 1970.", sideNote: "Codd's twelve rules established relational calculus as mathematical truth." },
    ],
    nextStory: {
      slug: "the-death-and-rebirth-of-the-independent-web",
      chapter: "CHAPTER II",
      title: "The Rebirth of the Independent Web: Why Writers Are Leaving Algorithmic Silos",
    },
  },
  "the-death-and-rebirth-of-the-independent-web": {
    slug: "the-death-and-rebirth-of-the-independent-web",
    chapter: "CHAPTER II",
    folio: "FOLIO 29–38",
    issue: "ISSUE IV • AUTUMN 2026",
    title: "The Rebirth of the Independent Web: Why Writers Are Leaving Algorithmic Silos",
    subtitle: "How dedicated publications and sovereign digital spaces are reclaiming the dignity of the written word.",
    author: "Marcus Chen",
    role: "Editorial Essayist",
    date: "October 5, 2026",
    readingTime: "4 min read",
    readingMinutesTotal: 4,
    publication: "Digital Ecology",
    content: [
      "The promise of the early social web was democratic distribution. The reality twenty years later is algorithmic homogenisation.",
      "When content is mediated by platforms whose primary incentive is advertising impression density, nuanced prose cannot survive. Writers are trained to optimize for provocation rather than depth, for click-through immediacy rather than resonance.",
      "What we are witnessing today is not the decline of reading, but the quiet migration of discerning readers toward independent digital gardens.",
      "Inkforge provides writers and editorial cooperatives with sovereign digital spaces: high-performance reading surfaces that respect the reader's attention span and elevate writing back to literature.",
    ],
    pullquote: "Discerning readers are quietly migrating away from engagement loops toward independent digital gardens.",
    nextStory: {
      slug: "block-based-composition-in-modern-publishing",
      chapter: "CHAPTER III",
      title: "The Architecture of Block Composition: From ProseMirror ASTs to Dynamic Canvases",
    },
  },
  "block-based-composition-in-modern-publishing": {
    slug: "block-based-composition-in-modern-publishing",
    chapter: "CHAPTER III",
    folio: "FOLIO 39–54",
    issue: "ISSUE IV • AUTUMN 2026",
    title: "The Architecture of Block Composition: From ProseMirror ASTs to Dynamic Canvases",
    subtitle: "Decoupling narrative intent from rendering mediums for expressive, multi-format publishing.",
    author: "David Vance",
    role: "Principal Frontend Engineer",
    date: "October 3, 2026",
    readingTime: "8 min read",
    readingMinutesTotal: 8,
    publication: "Inkforge Engineering",
    content: [
      "A publishing engine is only as good as its content model. In this technical deep-dive, we examine how Inkforge leverages ProseMirror schemas and Tiptap extensions to construct a zero-friction authoring canvas.",
      "Traditional rich-text editors produce messy, unpredictable HTML payloads littered with inline styles. In Inkforge, every document is serialized into a clean JSON document tree.",
      "This separation allows real-time collaborative editing, granular version diffing, and automated transforms into multiple output formats including clean HTML, Markdown, and syndication feeds.",
    ],
    pullquote: "A document tree should be an expressive abstract canvas, not a fragile bundle of tags.",
    nextStory: {
      slug: "crafting-systems-that-endure",
      chapter: "CHAPTER I",
      title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
    },
  },
  "notes-on-local-first-autosave": {
    slug: "notes-on-local-first-autosave",
    chapter: "DISPATCH IV",
    folio: "FOLIO 55–64",
    issue: "ISSUE IV • AUTUMN 2026",
    title: "The Scribe's Sanctuary: Local-First Draft Persistence in Uncertain Networks",
    subtitle: "An exploration of resilient state architectures that guarantee no author ever loses a syllable.",
    author: "Sarah Lindqvist",
    role: "Staff Fellow",
    date: "October 1, 2026",
    readingTime: "5 min read",
    readingMinutesTotal: 5,
    publication: "Systems & Theory",
    content: [
      "A writer sits with a cursor blinking in the twilight. Thoughts arrive in fragile cadence. If a browser tab crashes or a Wi-Fi handshake drops, the loss of an unfinished paragraph can sever the thread of an entire morning.",
      "Local-first software represents a moral imperative for digital tools. By prioritizing client-side persistent storage through localStorage and IndexedDB, we invert the conventional cloud dependency.",
      "Every keystroke is committed to the local sanctuary before any network synchronization is attempted. The network becomes a transport mechanism rather than a single point of failure.",
      "When authors trust their tools implicitly, cognitive overhead dissolves into pure concentration.",
    ],
    pullquote: "Local-first software represents a moral imperative: no author should ever lose a syllable to network turbulence.",
    nextStory: {
      slug: "crafting-systems-that-endure",
      chapter: "CHAPTER I",
      title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
    },
  },
};

export default function StoryReaderPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "crafting-systems-that-endure";
  const { tone } = useEdition();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [fontSize, setFontSize] = useState<"standard" | "large" | "generous">("standard");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeFootnote, setActiveFootnote] = useState<number | null>(null);
  const [solitaryMode, setSolitaryMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    try {
      const marks = JSON.parse(localStorage.getItem("inkforge_bookmarks") || "[]");
      setIsBookmarked(marks.includes(slug));
    } catch (e) {
      console.error(e);
    }
  }, [slug]);

  const toggleBookmark = () => {
    try {
      const marks = JSON.parse(localStorage.getItem("inkforge_bookmarks") || "[]");
      let updated;
      if (marks.includes(slug)) {
        updated = marks.filter((s: string) => s !== slug);
        setIsBookmarked(false);
      } else {
        updated = [...marks, slug];
        setIsBookmarked(true);
      }
      localStorage.setItem("inkforge_bookmarks", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const story = STORIES[slug] || {
    slug,
    chapter: "MANUSCRIPT",
    folio: "FOLIO ARCHIVE",
    issue: "INKFORGE PRESS ARCHIVE",
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    subtitle: "A monograph from the Inkforge Studio archive.",
    author: "Inkforge Author",
    role: "Staff Contributor",
    date: "Recent Edition",
    readingTime: "3 min read",
    readingMinutesTotal: 3,
    publication: "The Collective",
    content: [
      "This piece was authored and published via the Inkforge Writer Studio. Explore the studio to create and publish your own stories with living editorial typography.",
    ],
  };

  const copyUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getProseTextSize = () => {
    switch (fontSize) {
      case "large":
        return "text-xl leading-[1.95]";
      case "generous":
        return "text-2xl leading-[2.05]";
      default:
        return "text-lg leading-[1.88]";
    }
  };

  const remainingMinutes = Math.max(
    1,
    Math.ceil(story.readingMinutesTotal * (1 - scrollProgress / 100))
  );

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)] relative">
      {/* Pinned Scroll Progress Indicator */}
      <div
        className="fixed top-0 left-0 z-50 h-[2.5px] bg-[var(--oxblood)] transition-all duration-75 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Main Header (Hidden in Solitary Reading Mode) */}
      {!solitaryMode ? (
        <Header />
      ) : (
        /* Solitary Immersion Exit Banner */
        <div className="sticky top-0 z-40 border-b border-[var(--editorial-rule)] bg-[var(--paper-canvas)]/90 backdrop-blur-xs px-4 py-2 font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] flex items-center justify-between">
          <span>Solitary Reading Mode Active</span>
          <button
            type="button"
            onClick={() => setSolitaryMode(false)}
            className="flex items-center space-x-1 text-[var(--oxblood)] font-bold hover:underline"
          >
            <Minimize2 className="h-3 w-3" />
            <span>Exit Solitary Mode</span>
          </button>
        </div>
      )}

      <article className={`mx-auto px-4 py-12 sm:px-6 ${solitaryMode ? "max-w-2xl" : "max-w-4xl"}`}>
        {/* Navigation & Reader Folio Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between border-b border-[var(--editorial-rule)] pb-4 font-editorial-mono text-xs tracking-widest uppercase text-[var(--ink-muted)] gap-3">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 transition-colors hover:text-[var(--oxblood)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] rounded px-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Frontispiece</span>
          </Link>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Solitary Immersion Mode Toggle */}
            <button
              type="button"
              onClick={() => setSolitaryMode(!solitaryMode)}
              className="flex items-center space-x-1 hover:text-[var(--oxblood)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] rounded px-1"
              title={solitaryMode ? "Exit Solitary Mode" : "Enter Solitary Reading Mode"}
            >
              {solitaryMode ? (
                <Minimize2 className="h-3.5 w-3.5 text-[var(--oxblood)]" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{solitaryMode ? "Standard" : "Solitary"}</span>
            </button>

            {/* Type Scale Controls */}
            <div
              role="group"
              aria-label="Text Size Scale"
              className="flex items-center space-x-1 rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] px-1.5 py-0.5 text-[10px]"
            >
              <span className="text-[var(--ink-muted)] mr-1">TYPE:</span>
              <button
                type="button"
                onClick={() => setFontSize("standard")}
                className={`px-1 rounded ${
                  fontSize === "standard"
                    ? "font-bold text-[var(--oxblood)] bg-[var(--paper-warm)] shadow-xs"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
                title="Standard type scale"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("large")}
                className={`px-1 rounded ${
                  fontSize === "large"
                    ? "font-bold text-[var(--oxblood)] bg-[var(--paper-warm)] shadow-xs"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
                title="Large type scale"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize("generous")}
                className={`px-1 rounded ${
                  fontSize === "generous"
                    ? "font-bold text-[var(--oxblood)] bg-[var(--paper-warm)] shadow-xs"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
                title="Generous type scale"
              >
                A++
              </button>
            </div>

            {/* Bookmark Folio Ribbon Action */}
            <button
              type="button"
              onClick={toggleBookmark}
              className={`flex items-center space-x-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] rounded px-1 ${
                isBookmarked ? "text-[var(--oxblood)] font-bold" : "hover:text-[var(--oxblood)]"
              }`}
              title="Bookmark this monograph"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-3.5 w-3.5 fill-[var(--oxblood)] text-[var(--oxblood)]" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
            </button>

            {/* Citation Share */}
            <button
              type="button"
              onClick={copyUrl}
              className="flex items-center space-x-1 hover:text-[var(--oxblood)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] rounded px-1"
              title="Copy citation link"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? "Copied" : "Cite"}</span>
            </button>

            <span className="hidden md:inline">
              {story.chapter} • {story.folio}
            </span>
          </div>
        </div>

        {/* Article Monograph Header */}
        <header className="mb-10 text-center sm:text-left relative">
          {/* Active Bookmark Ribbon Accent */}
          {isBookmarked && <div className="book-ribbon" />}

          <div className="mb-3">
            <span className="font-editorial-mono text-xs font-bold tracking-widest uppercase text-[var(--oxblood)]">
              {story.publication} • {story.issue}
            </span>
          </div>

          <h1 className="font-editorial-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.1]">
            {story.title}
          </h1>

          <p className="mt-5 font-editorial-serif text-lg sm:text-xl text-[var(--ink-secondary)] italic leading-relaxed">
            {story.subtitle}
          </p>

          {/* Byline and Dynamic Reading Progress */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--editorial-rule)] py-4 font-editorial-sans text-xs text-[var(--ink-muted)]">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--paper-warm)] border border-[var(--paper-border)] font-editorial-serif font-bold text-sm text-[var(--oxblood)]">
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
                <span>{remainingMinutes} min remaining</span>
              </span>
            </div>
          </div>
        </header>

        {/* Monograph Body */}
        <div className={solitaryMode ? "space-y-6" : "grid lg:grid-cols-12 gap-8 items-start"}>
          {/* Main Prose Text */}
          <div className={`${solitaryMode ? "w-full" : "lg:col-span-9"} space-y-6 font-editorial-serif text-[var(--ink-primary)] transition-all`}>
            {story.content.map((paragraph, idx) => (
              <p
                key={idx}
                className={`${getProseTextSize()} ${idx === 0 ? "drop-cap" : ""}`}
              >
                {paragraph}
                {/* Embedded footnote trigger anchors */}
                {story.footnotes && idx === 1 && (
                  <sup
                    className="ml-1 cursor-pointer font-editorial-mono font-bold text-[var(--oxblood)] hover:underline"
                    onMouseEnter={() => setActiveFootnote(1)}
                    onMouseLeave={() => setActiveFootnote(null)}
                  >
                    [1]
                  </sup>
                )}
                {story.footnotes && idx === 3 && (
                  <sup
                    className="ml-1 cursor-pointer font-editorial-mono font-bold text-[var(--oxblood)] hover:underline"
                    onMouseEnter={() => setActiveFootnote(2)}
                    onMouseLeave={() => setActiveFootnote(null)}
                  >
                    [2]
                  </sup>
                )}
              </p>
            ))}

            {/* Editorial Pullquote */}
            {story.pullquote && (
              <blockquote className="editorial-pullquote my-10">
                &ldquo;{story.pullquote}&rdquo;
              </blockquote>
            )}
          </div>

          {/* Marginalia Sidebar (Displayed in standard mode on large screens) */}
          {!solitaryMode && (
            <aside className="hidden lg:block lg:col-span-3 space-y-6 font-editorial-sans text-xs text-[var(--ink-secondary)] border-l border-[var(--editorial-rule)] pl-5">
              <div className="font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
                Marginalia &amp; Apparatus
              </div>

              {story.footnotes &&
                story.footnotes.map((fn) => (
                  <div
                    key={fn.id}
                    className={`marginalia-item space-y-1 ${activeFootnote === fn.id ? "active" : ""}`}
                  >
                    <span className="font-editorial-mono text-[10px] font-bold text-[var(--oxblood)]">
                      [{fn.id}]
                    </span>
                    <p className="text-[11px] leading-relaxed text-[var(--ink-muted)] italic">
                      {fn.sideNote || fn.text}
                    </p>
                  </div>
                ))}
            </aside>
          )}
        </div>

        {/* Ornamental Divider */}
        <div className="editorial-divider my-12">
          <span>✦ • ✦</span>
        </div>

        {/* Footnotes Section */}
        {story.footnotes && (
          <div className="my-10 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-warm)] p-6 font-editorial-sans text-xs text-[var(--ink-secondary)]">
            <h4 className="font-editorial-mono font-bold uppercase tracking-wider text-[var(--oxblood)] mb-3">
              Footnotes &amp; Critical References
            </h4>
            <ol className="list-decimal pl-4 space-y-2">
              {story.footnotes.map((fn) => (
                <li key={fn.id} className="leading-relaxed">
                  {fn.text}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Proceed to Next Chapter Book-Jacket Box */}
        {story.nextStory && (
          <div className="my-12 rounded-xl book-jacket p-6 sm:p-8">
            <div className="font-editorial-mono text-xs font-bold uppercase tracking-widest text-[var(--oxblood)]">
              Proceed to Next Chapter
            </div>
            <Link
              href={`/read/${story.nextStory.slug}`}
              className="group block mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] rounded-md"
            >
              <span className="font-editorial-mono text-xs text-[var(--ink-muted)]">
                {story.nextStory.chapter}
              </span>
              <h3 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors mt-1">
                {story.nextStory.title}
              </h3>
              <div className="mt-3 inline-flex items-center space-x-1.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-[var(--oxblood)] group-hover:underline">
                <span>Open Next Monograph</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        )}

        {/* Author Colophon Box */}
        <footer className="mt-14 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-6 sm:p-8">
          <div className="flex items-start space-x-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--oxblood)] text-white font-editorial-serif font-bold text-lg">
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

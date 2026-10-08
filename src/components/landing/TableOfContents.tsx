"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookChapter,
  BOOK_CHAPTERS,
} from "./types";
import {
  ArrowRight,
  BookOpen,
  Compass,
  PenTool,
  Layers,
  Users,
  BookMarked,
  X,
  Sparkles,
} from "lucide-react";

interface TableOfContentsProps {
  onSelectChapter: (chapter: BookChapter) => void;
  onCloseBook: () => void;
  onUnveilFullApp: () => void;
}

export function TableOfContents({
  onSelectChapter,
  onCloseBook,
  onUnveilFullApp,
}: TableOfContentsProps) {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  const getChapterIcon = (id: string) => {
    switch (id) {
      case "read":
        return <BookOpen className="h-4 w-4 text-[var(--oxblood)]" />;
      case "discover":
        return <Compass className="h-4 w-4 text-[var(--amber-gold)]" />;
      case "write":
        return <PenTool className="h-4 w-4 text-[var(--oxblood)]" />;
      case "ledger":
        return <Layers className="h-4 w-4 text-[var(--forest)]" />;
      case "authors":
        return <Users className="h-4 w-4 text-[var(--oxblood)]" />;
      case "colophon":
        return <BookMarked className="h-4 w-4 text-[var(--amber-gold)]" />;
      default:
        return <BookOpen className="h-4 w-4 text-[var(--oxblood)]" />;
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-2xl book-edge-stack overflow-hidden">
      {/* Center Book Gutter Shadow */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 hidden md:block book-gutter-shadow pointer-events-none z-20" />
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-[var(--editorial-rule)] hidden md:block z-20 pointer-events-none" />

      {/* Hanging Silk Ribbon */}
      <div className="silk-ribbon-landing hidden sm:block" />

      {/* Two-Page Spread Grid */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--editorial-rule)]">
        {/* =====================================================================
            LEFT PAGE: Frontispiece, Colophon & Volume Epigraph
            ===================================================================== */}
        <div className="p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-[var(--paper-canvas)]/40 relative">
          <div>
            {/* Running Header */}
            <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3 font-editorial-mono text-[10px] tracking-widest uppercase text-[var(--ink-muted)]">
              <span>FOLIO IV</span>
              <span className="font-bold text-[var(--oxblood)]">AUTUMN MMXXVI</span>
              <span>p. 1</span>
            </div>

            {/* Frontispiece Vignette */}
            <div className="mt-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--paper-border)] bg-[var(--paper-warm)] shadow-xs">
                <span className="font-editorial-serif text-xl font-bold text-[var(--oxblood)]">
                  ✦
                </span>
              </div>

              <div className="space-y-1">
                <div className="font-editorial-mono text-[9px] uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                  The Scribe&apos;s Frontispiece
                </div>
                <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
                  Inkforge Publishing
                </h2>
              </div>

              {/* Classical Epigraph Quote */}
              <div className="mx-auto max-w-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-5 text-left shadow-xs">
                <p className="font-editorial-serif italic text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                  &ldquo;A digital publishing platform inspired by books, literary journals, and independent presses. Built not to imitate paper, but to give software the enduring stillness of literature.&rdquo;
                </p>
                <div className="mt-3 font-editorial-mono text-[9px] tracking-wider text-[var(--oxblood)] uppercase font-semibold text-right">
                  — The Editorial Preface
                </div>
              </div>
            </div>

            {/* Edition Almanac Quick Folio */}
            <div className="mt-8 grid grid-cols-2 gap-3 text-center font-editorial-mono text-[11px]">
              <div className="rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] p-2.5">
                <div className="font-bold font-editorial-serif text-base text-[var(--ink-primary)]">
                  38
                </div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                  Monographs
                </div>
              </div>

              <div className="rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] p-2.5">
                <div className="font-bold font-editorial-serif text-base text-[var(--oxblood)]">
                  100%
                </div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                  Local Scribe
                </div>
              </div>
            </div>
          </div>

          {/* Left Page Bottom: Close & Bypass Controls */}
          <div className="mt-8 pt-4 border-t border-[var(--editorial-rule)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <button
              onClick={onCloseBook}
              className="inline-flex items-center space-x-1.5 font-editorial-sans text-[11px] uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Close Cover</span>
            </button>

            <button
              onClick={onUnveilFullApp}
              className="inline-flex items-center space-x-1 font-editorial-sans text-[11px] uppercase tracking-wider text-[var(--oxblood)] font-semibold hover:underline"
            >
              <span>Direct to Gazetteer</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* =====================================================================
            RIGHT PAGE: Table of Contents / Interactive Chapters
            ===================================================================== */}
        <div className="p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-[var(--paper-surface)] relative">
          <div>
            {/* Running Header */}
            <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3 font-editorial-mono text-[10px] tracking-widest uppercase text-[var(--ink-muted)]">
              <span>INDEX RATIONIS</span>
              <span className="font-bold text-[var(--ink-primary)]">TABLE OF CONTENTS</span>
              <span>p. 2</span>
            </div>

            {/* Title */}
            <div className="mt-6 mb-4">
              <span className="font-editorial-mono text-[9px] uppercase tracking-[0.25em] text-[var(--oxblood)] font-bold">
                Volume IV • Continuous Edition
              </span>
              <h3 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)] mt-1">
                Chapters &amp; Inscriptions
              </h3>
            </div>

            {/* Chapters List */}
            <nav aria-label="Table of Contents Navigation" className="space-y-2 mt-4">
              {BOOK_CHAPTERS.map((chapter, index) => {
                const isActive = activeChapterIndex === index;

                return (
                  <div
                    key={chapter.id}
                    onMouseEnter={() => setActiveChapterIndex(index)}
                    onClick={() => onSelectChapter(chapter)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectChapter(chapter);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`group relative rounded-lg p-3 sm:p-3.5 border transition-all cursor-pointer select-none ${
                      isActive
                        ? "border-[var(--oxblood)] bg-[var(--paper-warm)] shadow-xs translate-x-1"
                        : "border-transparent hover:border-[var(--paper-border)] hover:bg-[var(--paper-canvas)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-[var(--paper-surface)] border border-[var(--paper-border)] shadow-2xs">
                          {getChapterIcon(chapter.id)}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-editorial-mono text-xs font-bold text-[var(--oxblood)]">
                              {chapter.roman}.
                            </span>
                            <span className="font-editorial-serif text-sm sm:text-base font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors">
                              {chapter.title}
                            </span>
                          </div>

                          <p className="mt-0.5 font-editorial-serif text-xs text-[var(--ink-secondary)] leading-snug line-clamp-1">
                            {chapter.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Dot Leaders & Folio */}
                      <div className="flex items-center space-x-2 font-editorial-mono text-[10px] text-[var(--ink-muted)] shrink-0 self-center">
                        <span className="hidden sm:inline tracking-tighter opacity-40">
                          . . . .
                        </span>
                        <span className="font-semibold">{chapter.folio}</span>
                        <ArrowRight className="h-3 w-3 text-[var(--oxblood)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right Page Bottom: Quick Navigation Footer */}
          <div className="mt-6 pt-4 border-t border-[var(--editorial-rule)] flex items-center justify-between font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
            <span>Select chapter to open</span>
            <span className="text-[var(--oxblood)] font-bold">
              Chapter {BOOK_CHAPTERS[activeChapterIndex].roman} of VI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

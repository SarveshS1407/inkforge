"use client";

import { Sparkles, ArrowRight, BookOpen } from "lucide-react";

interface BookCoverProps {
  onOpen: () => void;
  isOpening?: boolean;
}

export function BookCover({ onOpen, isOpening = false }: BookCoverProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Open INKFORGE Volume IV interactive book"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`group relative mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl aspect-[3/4] sm:aspect-[4/5] rounded-r-2xl rounded-l-md border border-[var(--paper-border)] bg-[var(--paper-surface)] p-8 sm:p-12 shadow-2xl book-edge-stack cursor-pointer select-none transition-all duration-500 overflow-hidden ${
        isOpening ? "opacity-90 scale-[0.98]" : "hover:-translate-y-1.5 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
      }`}
    >
      {/* Cloth Texture Background */}
      <div className="absolute inset-0 cloth-texture opacity-30 pointer-events-none" />

      {/* Book Spine Left Groove Hinge */}
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-10 book-spine-hinge pointer-events-none" />
      <div className="absolute left-8 sm:left-10 top-0 bottom-0 w-[1px] bg-[var(--editorial-rule)] pointer-events-none" />

      {/* Hanging Silk Ribbon Bookmark */}
      <div className="silk-ribbon-landing" title="Silk bookmark ribbon" />

      {/* Decorative Blind-Debossed Frame */}
      <div className="absolute inset-6 sm:inset-8 border border-[var(--paper-border)] pointer-events-none rounded-r-xl" />
      <div className="absolute inset-8 sm:inset-10 border border-[var(--editorial-rule)] opacity-40 pointer-events-none" />

      {/* Cover Content */}
      <div className="relative h-full flex flex-col justify-between pl-6 sm:pl-8 text-center">
        {/* Top Header Colophon */}
        <div className="space-y-2 pt-2">
          <div className="font-editorial-mono text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[var(--oxblood)] font-bold">
            I N K F O R G E
          </div>
          <div className="font-editorial-mono text-[9px] uppercase tracking-[0.25em] text-[var(--ink-muted)]">
            Publishing House &amp; Reader • Est. 2026
          </div>
        </div>

        {/* Center Volume Title & Emblem */}
        <div className="my-auto py-6 space-y-4 sm:space-y-6">
          {/* Embossed Press Crest */}
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-[var(--paper-border)] bg-[var(--paper-warm)] shadow-xs transition-transform group-hover:scale-105">
            <span className="font-editorial-serif text-2xl font-bold text-[var(--oxblood)]">
              ❦
            </span>
          </div>

          <div className="space-y-2">
            <span className="font-editorial-mono text-xs uppercase tracking-[0.3em] text-[var(--amber-gold)] font-semibold">
              VOLUME IV
            </span>
            <h1 className="font-editorial-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.1]">
              A Living <br />
              Digital Book
            </h1>
          </div>

          <p className="mx-auto max-w-xs font-editorial-serif text-sm sm:text-base text-[var(--ink-secondary)] italic leading-relaxed">
            &ldquo;Crafting systems that endure: the philosophy of long-horizon software.&rdquo;
          </p>

          <div className="pt-2 font-editorial-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
            Continuous Press • Autumn Edition
          </div>
        </div>

        {/* Bottom Interactive Invitation to Open */}
        <div className="pt-4 border-t border-[var(--editorial-rule)] space-y-3">
          <div className="inline-flex items-center space-x-2 rounded-full bg-[var(--oxblood)] px-5 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all group-hover:bg-[var(--oxblood-hover)] group-hover:shadow-md group-hover:scale-[1.02]">
            <span>Open Book Navigation</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>

          <div className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
            Press <kbd className="px-1 py-0.5 rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] font-mono text-[8px]">Enter</kbd> or Click to Unfold Spread
          </div>
        </div>
      </div>
    </div>
  );
}

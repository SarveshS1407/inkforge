"use client";

import Link from "next/link";
import { useEdition } from "@/components/theme/EditionContext";
import { PenTool, BookOpen, Layers, Sun, Moon, Compass } from "lucide-react";

export function Header() {
  const { mode, toggleMode } = useEdition();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--paper-border)] bg-[var(--paper-bg)]/90 backdrop-blur-md transition-colors">
      {/* Top Folio / Running Header */}
      <div className="border-b border-[var(--paper-border-subtle)] px-4 py-1 text-center font-editorial-mono text-[11px] tracking-widest uppercase text-[var(--ink-muted)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="hidden sm:inline">VOL. IV • NO. 10</span>
          <span>A LIVING DIGITAL JOURNAL OF CONTEMPORARY THOUGHT &amp; CRAFT</span>
          <span className="hidden sm:inline">FOLIO IF-2026</span>
        </div>
      </div>

      {/* Main Masthead Bar */}
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand / Title */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="group flex flex-col">
            <span className="font-editorial-serif text-2xl font-bold tracking-[0.25em] text-[var(--ink-primary)] transition-colors group-hover:text-[var(--oxblood)]">
              INKFORGE
            </span>
            <span className="font-editorial-mono text-[9px] tracking-[0.3em] uppercase text-[var(--ink-muted)]">
              Publishing House &amp; Studio
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 font-editorial-sans text-xs tracking-wider uppercase font-medium text-[var(--ink-secondary)]">
            <Link
              href="/"
              className="flex items-center space-x-1.5 transition-colors hover:text-[var(--oxblood)]"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Index</span>
            </Link>
            <Link
              href="/posts"
              className="flex items-center space-x-1.5 transition-colors hover:text-[var(--oxblood)]"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Editorial Ledger</span>
            </Link>
          </nav>
        </div>

        {/* Controls & Actions */}
        <div className="flex items-center space-x-3">
          {/* Edition Theme Toggle (Paper vs Inkwell) */}
          <button
            type="button"
            onClick={toggleMode}
            className="flex items-center space-x-1.5 rounded-full border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-1.5 font-editorial-mono text-[11px] font-medium text-[var(--ink-secondary)] transition-all hover:border-[var(--oxblood)] hover:text-[var(--ink-primary)]"
            title={`Switch to ${mode === "paper" ? "Inkwell Edition (Night)" : "Paper Edition (Day)"}`}
          >
            {mode === "paper" ? (
              <>
                <Moon className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                <span className="hidden sm:inline">Paper Edition</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-[var(--amber-gold)]" />
                <span className="hidden sm:inline">Inkwell Edition</span>
              </>
            )}
          </button>

          {/* Scribe / Write Action */}
          <Link
            href="/write"
            className="group flex items-center space-x-2 rounded-full bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold tracking-wider uppercase text-white shadow-sm transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <PenTool className="h-3.5 w-3.5 transition-transform group-hover:-rotate-12" />
            <span>Open Studio</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

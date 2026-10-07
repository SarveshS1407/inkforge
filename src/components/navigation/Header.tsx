"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEdition } from "@/components/theme/EditionContext";
import { PenTool, Compass, Layers, Sun, Moon } from "lucide-react";

export function Header() {
  const { mode, toggleMode } = useEdition();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--paper-border)] bg-[var(--paper-bg)]/90 backdrop-blur-md transition-colors">
      {/* Running Folio / Volume Bar */}
      <div className="border-b border-[var(--paper-border-subtle)] px-4 py-1.5 text-center font-editorial-mono text-[10px] tracking-widest uppercase text-[var(--ink-muted)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="hidden sm:inline">VOL. IV • NO. 10</span>
          <span>A LIVING DIGITAL JOURNAL OF CONTEMPORARY THOUGHT &amp; CRAFT</span>
          <span className="hidden sm:inline">FOLIO IF-2026</span>
        </div>
      </div>

      {/* Main Masthead Bar */}
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand Masthead */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="group flex flex-col focus:outline-none">
            <span className="font-editorial-serif text-xl font-bold tracking-[0.28em] text-[var(--ink-primary)] transition-colors group-hover:text-[var(--oxblood)]">
              INKFORGE
            </span>
            <span className="font-editorial-mono text-[8.5px] tracking-[0.32em] uppercase text-[var(--ink-muted)]">
              Publishing House &amp; Studio
            </span>
          </Link>

          {/* Primary Navigation */}
          <nav className="hidden md:flex items-center space-x-1 font-editorial-sans text-xs uppercase tracking-wider font-medium text-[var(--ink-secondary)]">
            <Link
              href="/"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
                pathname === "/"
                  ? "text-[var(--oxblood)] font-semibold bg-[var(--paper-card)]"
                  : "hover:text-[var(--ink-primary)] hover:bg-[var(--paper-card-hover)]"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Index</span>
            </Link>
            <Link
              href="/posts"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
                pathname.startsWith("/posts")
                  ? "text-[var(--oxblood)] font-semibold bg-[var(--paper-card)]"
                  : "hover:text-[var(--ink-primary)] hover:bg-[var(--paper-card-hover)]"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Editorial Ledger</span>
            </Link>
          </nav>
        </div>

        {/* Tactile Actions */}
        <div className="flex items-center space-x-3">
          {/* Edition Mode Toggle */}
          <button
            type="button"
            onClick={toggleMode}
            className="flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1.5 font-editorial-mono text-[11px] font-medium text-[var(--ink-secondary)] shadow-xs transition-all hover:border-[var(--oxblood)] hover:text-[var(--ink-primary)] active:scale-[0.98]"
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

          {/* Scribe / Studio Action */}
          <Link
            href="/write"
            className="group flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-3.5 py-1.5 font-editorial-sans text-xs font-semibold tracking-wider uppercase text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-sm active:scale-[0.98]"
          >
            <PenTool className="h-3.5 w-3.5 transition-transform group-hover:-rotate-12" />
            <span>Open Studio</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEdition, PaperTone } from "@/components/theme/EditionContext";
import { PenTool, Compass, Layers, Sparkles, BookOpen } from "lucide-react";

export function Header() {
  const { tone, setTone } = useEdition();
  const pathname = usePathname();

  const tones: { id: PaperTone; label: string; swatch: string }[] = [
    { id: "cotton", label: "Cotton", swatch: "bg-[#fbf9f4] border-[#e4dccb]" },
    { id: "vellum", label: "Vellum", swatch: "bg-[#f4eee2] border-[#d7c7ab]" },
    { id: "inkwell", label: "Buckram", swatch: "bg-[#16171b] border-[#2a2d35]" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--paper-border)] bg-[var(--paper-canvas)]/92 backdrop-blur-md transition-colors">
      {/* Editorial Running Header / Folio */}
      <div className="border-b border-[var(--paper-border-subtle)] px-4 py-1.5 font-editorial-mono text-[10px] tracking-widest uppercase text-[var(--ink-muted)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[var(--oxblood)]">VOL. IV</span>
            <span>•</span>
            <span className="hidden sm:inline">ISSUE 10 • AUTUMN 2026</span>
          </div>
          <span className="text-center font-medium tracking-[0.2em]">
            A LIVING DIGITAL BOOK FOR THE MODERN INTERNET
          </span>
          <div className="hidden sm:flex items-center space-x-2">
            <span>PRESS IF-2026</span>
            <span>•</span>
            <span className="text-[var(--amber-gold)]">CONTINUOUS PRESS</span>
          </div>
        </div>
      </div>

      {/* Main Masthead */}
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand Colophon */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="group flex flex-col focus:outline-none">
            <span className="font-editorial-serif text-xl font-bold tracking-[0.3em] text-[var(--ink-primary)] transition-colors group-hover:text-[var(--oxblood)]">
              INKFORGE
            </span>
            <span className="font-editorial-mono text-[8px] tracking-[0.32em] uppercase text-[var(--ink-muted)]">
              Publishing House &amp; Reader
            </span>
          </Link>

          {/* Primary Editorial Navigation */}
          <nav className="hidden md:flex items-center space-x-1 font-editorial-sans text-xs uppercase tracking-wider font-medium text-[var(--ink-secondary)]">
            <Link
              href="/"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
                pathname === "/"
                  ? "text-[var(--oxblood)] font-bold bg-[var(--paper-warm)] shadow-xs"
                  : "hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)]"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Gazetteer</span>
            </Link>
            <Link
              href="/posts"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
                pathname.startsWith("/posts")
                  ? "text-[var(--oxblood)] font-bold bg-[var(--paper-warm)] shadow-xs"
                  : "hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)]"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Editorial Ledger</span>
            </Link>
            <Link
              href="/?view=toc"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors hover:text-[var(--oxblood)] hover:bg-[var(--paper-warm)]"
              title="Open Volume IV Interactive Book Navigation"
            >
              <BookOpen className="h-3.5 w-3.5 text-[var(--oxblood)]" />
              <span>Book Folio</span>
            </Link>
          </nav>
        </div>

        {/* Paper Material Selector & Scribe CTA */}
        <div className="flex items-center space-x-4">
          {/* Tri-Paper Material Palette Selector */}
          <div className="flex items-center space-x-1 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] p-1 shadow-xs">
            <span className="hidden lg:inline font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] px-1.5">
              Paper:
            </span>
            {tones.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-editorial-mono uppercase tracking-wider transition-all ${
                  tone === t.id
                    ? "bg-[var(--paper-warm)] font-bold text-[var(--ink-primary)] shadow-xs border border-[var(--paper-border)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
                title={`Switch to ${t.label} Paper Tone`}
              >
                <span className={`inline-block h-2 w-2 rounded-full border ${t.swatch}`} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Scribe / Studio CTA */}
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

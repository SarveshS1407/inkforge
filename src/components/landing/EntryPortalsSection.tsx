"use client";

import { useState } from "react";
import { Terminal, BookOpen, Feather, Lock, Compass, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { SignInModal } from "@/components/auth/SignInModal";

export function EntryPortalsSection() {
  const [activePortal, setActivePortal] = useState<"TECH" | "READER" | "AUTHOR" | null>(null);

  return (
    <>
      <section className="scroll-pop-reveal my-12 border-y border-[var(--editorial-rule)] bg-[var(--paper-warm)]/50 py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Section Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center space-x-2 font-editorial-mono text-[10px] sm:text-xs uppercase tracking-[0.26em] text-[var(--oxblood)] font-bold">
              <span>SANCTUARY ENTRYWAYS</span>
              <span>•</span>
              <span>CHOOSE YOUR DISCIPLINE</span>
            </div>
            <h2 className="font-editorial-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--ink-primary)]">
              Three Dedicated Sanctuaries
            </h2>
            <p className="mx-auto max-w-xl font-editorial-serif text-sm sm:text-base italic text-[var(--ink-secondary)]">
              Whether you are here to curate the press, absorb literature, or inscribe a new book.
            </p>
          </div>

          {/* Three Portals Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* 1. READER PORTAL */}
            <div className="book-jacket rounded-xl p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-md border border-[var(--paper-border)] bg-[var(--paper-surface)]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-editorial-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                    Public Access
                  </span>
                  <div className="h-8 w-8 rounded-full bg-[var(--paper-warm)] border border-[var(--paper-border)] flex items-center justify-center text-[var(--oxblood)]">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <h3 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
                    Reader Sanctuary
                  </h3>
                  <p className="mt-2 text-xs font-editorial-serif text-[var(--ink-secondary)] leading-relaxed">
                    Immerse yourself in public literary anthologies, browse verified author profiles, bookmark chapters, and organize personal reading collections.
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--editorial-rule)] space-y-1.5 font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    <span>Continuous vertical book reader</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    <span>Curated thematic volumes</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    <span>Free reader registration</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--editorial-rule)]">
                <button
                  type="button"
                  onClick={() => setActivePortal("READER")}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--paper-warm)] border border-[var(--paper-border)] hover:border-[var(--oxblood)] px-4 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-[var(--ink-primary)] hover:text-[var(--oxblood)] transition-all cursor-pointer shadow-2xs"
                >
                  <Compass className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                  <span>Enter as Reader</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 2. AUTHOR PORTAL */}
            <div className="book-jacket rounded-xl p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-md border-2 border-[var(--oxblood)]/50 bg-[var(--paper-surface)] relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-editorial-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[var(--oxblood)]/10 text-[var(--oxblood)] border border-[var(--oxblood)]/30 font-bold">
                    Author Atelier
                  </span>
                  <div className="h-8 w-8 rounded-full bg-[var(--oxblood)]/10 border border-[var(--oxblood)]/20 flex items-center justify-center text-[var(--oxblood)]">
                    <Feather className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <h3 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
                    Author Atelier
                  </h3>
                  <p className="mt-2 text-xs font-editorial-serif text-[var(--ink-secondary)] leading-relaxed">
                    A dedicated craft studio for writing multi-chapter books, importing Word (.docx) &amp; PDF manuscripts, designing custom bookbindings, and controlled publishing.
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--editorial-rule)] space-y-1.5 font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[var(--oxblood)]">✦</span>
                    <span>Direct writing, paste, or Word/PDF import</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[var(--oxblood)]">✦</span>
                    <span>Private drafts &amp; Public release controls</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[var(--oxblood)]">✦</span>
                    <span>Version history &amp; revision restoration</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--editorial-rule)]">
                <button
                  type="button"
                  onClick={() => setActivePortal("AUTHOR")}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Author Sign In / Register</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 3. TECH PORTAL */}
            <div className="book-jacket rounded-xl p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-md border border-[var(--paper-border)] bg-[var(--paper-surface)]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-editorial-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Restricted</span>
                  </span>
                  <div className="h-8 w-8 rounded-full bg-[var(--paper-warm)] border border-[var(--paper-border)] flex items-center justify-center text-[var(--amber-gold)]">
                    <Terminal className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <h3 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
                    Technical Console
                  </h3>
                  <p className="mt-2 text-xs font-editorial-serif text-[var(--ink-secondary)] leading-relaxed">
                    Restricted administration console for database migration observability, system health telemetry, cryptographic session tokens, and operational governance.
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--editorial-rule)] space-y-1.5 font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    <span>System health &amp; database verification</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    <span>Content moderation &amp; author roles</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    <span>Cross-platform build telemetry</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--editorial-rule)]">
                <button
                  type="button"
                  onClick={() => setActivePortal("TECH")}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--paper-warm)] border border-[var(--paper-border)] hover:border-amber-600/60 px-4 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-[var(--ink-primary)] hover:text-amber-700 dark:hover:text-amber-400 transition-all cursor-pointer shadow-2xs"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Tech Admin Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal with Portal Context */}
      <SignInModal
        isOpen={activePortal !== null}
        onClose={() => setActivePortal(null)}
        initialPortal={activePortal || undefined}
      />
    </>
  );
}

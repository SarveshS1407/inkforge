"use client";

import { useState, useCallback, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhysicalBook } from "./PhysicalBook";
import { BookChapter } from "./types";
import { SignInModal } from "@/components/auth/SignInModal";
import { Header } from "@/components/navigation/Header";
import {
  BookOpen,
  Compass,
  PenTool,
  Layers,
  Users,
  HelpCircle,
  Info,
  ArrowRight,
  User,
  Sparkles,
} from "lucide-react";

interface InkforgeLandingProps {
  children?: ReactNode;
}

export function InkforgeLanding({ children }: InkforgeLandingProps) {
  const router = useRouter();
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  const handleOpenBook = useCallback(() => {
    setIsBookOpen(true);
  }, []);

  const handleCloseBook = useCallback(() => {
    setIsBookOpen(false);
  }, []);

  const handleSelectChapter = useCallback(
    (chapter: BookChapter) => {
      if (chapter.href) {
        router.push(chapter.href);
      }
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)] selection:bg-[var(--oxblood)] selection:text-white">
      <Header />
      {/* =======================================================================
          HERO STAGE: Masthead + 3D Book Centerpiece + Primary Action Hierarchy
          ======================================================================= */}
      <section className="relative border-b border-[var(--editorial-rule)] pt-8 pb-14 px-4 sm:px-6 overflow-hidden">
        <div className="mx-auto max-w-5xl">
          {/* Masthead Hierarchy */}
          <div className="text-center space-y-3 mb-6 sm:mb-8">
            <div className="inline-flex items-center space-x-2 font-editorial-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[var(--oxblood)] font-bold">
              <span>Write</span>
              <span>•</span>
              <span>Publish</span>
              <span>•</span>
              <span>Discover</span>
              <span>•</span>
              <span>Read</span>
            </div>

            <h1 className="font-editorial-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.1]">
              A Living Digital Book
            </h1>

            <p className="mx-auto max-w-xl font-editorial-serif text-base sm:text-lg text-[var(--ink-secondary)] italic leading-relaxed">
              A modern home for people who create, publish, and love written work. Built with the permanence of literature and the energy of software.
            </p>
          </div>

          {/* Interactive Physical 3D Book Centerpiece */}
          <div className="flex flex-col items-center justify-center my-2 sm:my-4">
            <PhysicalBook
              isOpen={isBookOpen}
              onOpen={handleOpenBook}
              onClose={handleCloseBook}
              onSelectChapter={handleSelectChapter}
            />

            {/* Subtle contextual hint below book */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setIsBookOpen(!isBookOpen)}
                className="font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors inline-flex items-center space-x-1.5"
              >
                <span>{isBookOpen ? "Close Volume (Esc)" : "Click Book to Open Inscription"}</span>
              </button>
            </div>
          </div>

          {/* ===================================================================
              PRIMARY ACTIONS (Level 1: Read · Discover · Write)
              =================================================================== */}
          <div className="mt-10 pt-8 border-t border-[var(--paper-border-subtle)]">
            <div className="text-center mb-5">
              <span className="font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
                Choose Where to Begin
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Primary 1: READ */}
              <Link
                href="/read/crafting-systems-that-endure"
                className="group relative rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 transition-all duration-200 hover:border-[var(--oxblood)] hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--oxblood)]/10 text-[var(--oxblood)] group-hover:bg-[var(--oxblood)] group-hover:text-white transition-colors">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <span className="font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold">
                      Destination 01
                    </span>
                  </div>

                  <div>
                    <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors">
                      Read
                    </h2>
                    <p className="font-editorial-sans text-xs text-[var(--ink-secondary)] mt-1.5 leading-relaxed">
                      Read stories, essays, ideas, and perspectives from writers on INKFORGE in our distraction-free reader.
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--editorial-rule)] flex items-center justify-between text-xs font-editorial-sans text-[var(--oxblood)] font-semibold">
                  <span>Enter Reader</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              {/* Primary 2: DISCOVER */}
              <Link
                href="/discover"
                className="group relative rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 transition-all duration-200 hover:border-[var(--oxblood)] hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--amber-gold)]/15 text-[var(--amber-gold)] group-hover:bg-[var(--oxblood)] group-hover:text-white transition-colors">
                      <Compass className="h-5 w-5" />
                    </div>
                    <span className="font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold">
                      Destination 02
                    </span>
                  </div>

                  <div>
                    <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors">
                      Discover
                    </h2>
                    <p className="font-editorial-sans text-xs text-[var(--ink-secondary)] mt-1.5 leading-relaxed">
                      Find new writers, explore topics across systems craft and digital theory, and browse curated collections.
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--editorial-rule)] flex items-center justify-between text-xs font-editorial-sans text-[var(--oxblood)] font-semibold">
                  <span>Explore Catalog</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              {/* Primary 3: WRITE */}
              <Link
                href="/write"
                className="group relative rounded-xl border-2 border-[var(--oxblood)]/30 bg-[var(--paper-surface)] p-6 transition-all duration-200 hover:border-[var(--oxblood)] hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--oxblood)] text-white shadow-xs">
                      <PenTool className="h-5 w-5" />
                    </div>
                    <span className="font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold">
                      Destination 03
                    </span>
                  </div>

                  <div>
                    <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors">
                      Write
                    </h2>
                    <p className="font-editorial-sans text-xs text-[var(--ink-secondary)] mt-1.5 leading-relaxed">
                      Create, edit, and publish your own work in our local-first Scribe Studio with automatic draft saving.
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--editorial-rule)] flex items-center justify-between text-xs font-editorial-sans text-[var(--oxblood)] font-semibold">
                  <span>Open Studio</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>

          {/* ===================================================================
              SECONDARY ACTIONS (Collections · Authors)
              =================================================================== */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href="/collections"
              className="group flex items-center justify-between rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)]/70 px-4 py-3 transition-colors hover:border-[var(--oxblood)] hover:bg-[var(--paper-surface)]"
            >
              <div className="flex items-center space-x-3">
                <Layers className="h-4 w-4 text-[var(--ink-muted)] group-hover:text-[var(--oxblood)] transition-colors" />
                <div>
                  <span className="font-editorial-serif font-bold text-sm text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors">
                    Collections
                  </span>
                  <span className="font-editorial-sans text-xs text-[var(--ink-muted)] ml-2 hidden sm:inline">
                    Explore writing gathered around ideas and themes
                  </span>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--ink-muted)] group-hover:text-[var(--oxblood)] group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/authors"
              className="group flex items-center justify-between rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)]/70 px-4 py-3 transition-colors hover:border-[var(--oxblood)] hover:bg-[var(--paper-surface)]"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-4 w-4 text-[var(--ink-muted)] group-hover:text-[var(--oxblood)] transition-colors" />
                <div>
                  <span className="font-editorial-serif font-bold text-sm text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors">
                    Authors
                  </span>
                  <span className="font-editorial-sans text-xs text-[var(--ink-muted)] ml-2 hidden sm:inline">
                    Discover the people behind the published work
                  </span>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--ink-muted)] group-hover:text-[var(--oxblood)] group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

          {/* ===================================================================
              UTILITY NAVIGATION (Help · About · Sign In)
              =================================================================== */}
          <div className="mt-6 pt-4 border-t border-[var(--editorial-rule)] flex flex-wrap items-center justify-between gap-3 font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
            <div className="flex items-center space-x-5">
              <Link
                href="/help"
                className="flex items-center space-x-1.5 hover:text-[var(--oxblood)] transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Help &amp; FAQ</span>
              </Link>

              <Link
                href="/about"
                className="flex items-center space-x-1.5 hover:text-[var(--oxblood)] transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
                <span>About INKFORGE</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setSignInOpen(true)}
              className="flex items-center space-x-1.5 text-[var(--ink-secondary)] hover:text-[var(--oxblood)] transition-colors font-semibold"
            >
              <User className="h-3.5 w-3.5" />
              <span>Sign In / Account</span>
            </button>
          </div>
        </div>
      </section>

      {/* =======================================================================
          APPLICATION CONTENT: The Live Published Anthology & Dispatches
          ======================================================================= */}
      {children}

      {/* Global Sign In Modal */}
      <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
}

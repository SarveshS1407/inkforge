"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PhysicalBook } from "./PhysicalBook";
import { BookChapter } from "./types";
import { Header } from "@/components/navigation/Header";
import { BookMarked } from "lucide-react";

interface InkforgeLandingProps {
  children?: ReactNode;
}

export function InkforgeLanding({ children }: InkforgeLandingProps) {
  const router = useRouter();
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [skipInitialAnimation, setSkipInitialAnimation] = useState(false);

  // Restore open book state when navigating back via browser/Android Back button
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedState = sessionStorage.getItem("inkforge_book_open");
        const historyState = window.history.state?.bookOpen;
        if (savedState === "1" || historyState === true) {
          setIsBookOpen(true);
          setSkipInitialAnimation(true);
        }
      } catch {}
    }
  }, []);

  // Listen for browser popstate (back/forward history traversals)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.bookOpen === "boolean") {
        setIsBookOpen(event.state.bookOpen);
        setSkipInitialAnimation(true);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleOpenBook = useCallback(() => {
    setIsBookOpen(true);
    setSkipInitialAnimation(false);
    try {
      sessionStorage.setItem("inkforge_book_open", "1");
      window.history.replaceState({ ...window.history.state, bookOpen: true }, "", window.location.href);
    } catch {}
  }, []);

  const handleCloseBook = useCallback(() => {
    setIsBookOpen(false);
    setSkipInitialAnimation(false);
    try {
      sessionStorage.removeItem("inkforge_book_open");
      window.history.replaceState({ ...window.history.state, bookOpen: false }, "", window.location.href);
    } catch {}
  }, []);

  const handleSelectChapter = useCallback(
    (chapter: BookChapter) => {
      if (chapter.href) {
        try {
          sessionStorage.setItem("inkforge_book_open", "1");
          window.history.replaceState({ ...window.history.state, bookOpen: true }, "", window.location.href);
        } catch {}
        router.push(chapter.href);
      }
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)] selection:bg-[var(--oxblood)] selection:text-white">
      <Header />

      {/* =======================================================================
          HERO STAGE: The 5-Second Test Editorial Masthead + 3D Book Centerpiece
          ======================================================================= */}
      <section className="relative border-b border-[var(--editorial-rule)] pt-8 pb-14 px-4 sm:px-6 overflow-hidden">
        <div className="mx-auto max-w-5xl">
          {/* Masthead Hierarchy: Identity + Core Product Promise */}
          <div className="text-center space-y-3.5 mb-6 sm:mb-8">
            <div className="inline-flex items-center space-x-2.5 font-editorial-mono text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[var(--oxblood)] font-bold">
              <span>INKFORGE</span>
              <span className="opacity-40">•</span>
              <span>AN INDEPENDENT DIGITAL PRESS</span>
            </div>

            <h1 className="font-editorial-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.06]">
              Write. Publish. Discover. Read.
            </h1>

            <p className="mx-auto max-w-2xl font-editorial-serif text-base sm:text-lg md:text-xl text-[var(--ink-secondary)] italic leading-relaxed">
              A digital publishing platform inspired by classical bookcraft and built for modern authors and readers. Permanent words, living software.
            </p>
          </div>

          {/* Interactive Physical 3D Book Centerpiece */}
          <div className="flex flex-col items-center justify-center my-3 sm:my-5">
            <PhysicalBook
              isOpen={isBookOpen}
              skipInitialAnimation={skipInitialAnimation}
              onOpen={handleOpenBook}
              onClose={handleCloseBook}
              onSelectChapter={handleSelectChapter}
            />

            {/* Contextual control & hint below book */}
            <div className="mt-5 text-center flex flex-col items-center space-y-2">
              <button
                type="button"
                onClick={() => (isBookOpen ? handleCloseBook() : handleOpenBook())}
                aria-expanded={isBookOpen}
                className="font-editorial-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--ink-secondary)] hover:text-[var(--oxblood)] transition-all inline-flex items-center space-x-2 border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2.5 rounded-full shadow-2xs hover:border-[var(--oxblood)] hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] touch-manipulation touch-tactile min-h-[44px] cursor-pointer"
              >
                <BookMarked className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                <span>
                  {isBookOpen
                    ? "Close Volume (Esc)"
                    : "Click volume or press Enter to unfold folios"}
                </span>
              </button>

              <p className="font-editorial-mono text-[9px] uppercase tracking-[0.24em] text-[var(--ink-muted)]">
                Or scroll to explore the autumn anthology below ↓
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =======================================================================
          APPLICATION CONTENT: The Curated Published Anthology & Dispatches
          ======================================================================= */}
      {children}
    </div>
  );
}

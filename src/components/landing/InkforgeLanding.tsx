"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PhysicalBook } from "./PhysicalBook";
import { AuthorsModal } from "./AuthorsModal";
import { ColophonModal } from "./ColophonModal";
import { BookState, BookChapter } from "./types";
import { BookOpen, Compass, ArrowRight, RotateCcw } from "lucide-react";

interface InkforgeLandingProps {
  children: ReactNode;
}

export function InkforgeLanding({ children }: InkforgeLandingProps) {
  const router = useRouter();
  const [bookState, setBookState] = useState<BookState>("closed");
  const [activeModal, setActiveModal] = useState<"authors" | "colophon" | null>(null);

  // Check if user came with a hash or parameter to directly unveil or open
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("view") === "gazetteer") {
        setBookState("unveiled");
      } else if (urlParams.get("view") === "toc") {
        setBookState("open");
      }
    }
  }, []);

  const handleOpenBook = useCallback(() => {
    setBookState("open");
  }, []);

  const handleCloseBook = useCallback(() => {
    setBookState("closed");
  }, []);

  const handleUnveilFullApp = useCallback(() => {
    setBookState("unveiled");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleSelectChapter = useCallback(
    (chapter: BookChapter) => {
      if (chapter.actionType === "unveil") {
        handleUnveilFullApp();
      } else if (chapter.actionType === "modal" && chapter.modalTarget) {
        setActiveModal(chapter.modalTarget);
      } else if (chapter.actionType === "link" && chapter.href) {
        setBookState("flipping");
        setTimeout(() => {
          router.push(chapter.href!);
        }, 300);
      }
    },
    [handleUnveilFullApp, router]
  );

  // Global keyboard shortcuts (Esc to close modal/book)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeModal) {
          setActiveModal(null);
        } else if (bookState === "open") {
          setBookState("closed");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal, bookState]);

  // If unveiled, render the full baseline frontispiece application with a docked Book Folio re-entry button
  if (bookState === "unveiled") {
    return (
      <div className="relative min-h-screen">
        {/* Floating Docked Book Folio Quick Re-entry */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setBookState("open")}
            aria-label="Return to Interactive Book Navigation"
            className="group flex items-center space-x-2 rounded-full border border-[var(--paper-border)] bg-[var(--paper-surface)]/95 px-4 py-2.5 font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-primary)] shadow-lg backdrop-blur-md transition-all hover:border-[var(--oxblood)] hover:shadow-xl active:scale-95"
          >
            <BookOpen className="h-4 w-4 text-[var(--oxblood)] transition-transform group-hover:-rotate-12" />
            <span className="font-semibold">Open Book Folio</span>
            <span className="text-[10px] text-[var(--ink-muted)] hidden sm:inline">
              (Vol. IV)
            </span>
          </button>
        </div>

        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[var(--paper-canvas)] text-[var(--ink-primary)] selection:bg-[var(--oxblood)] selection:text-white overflow-x-hidden">
      {/* Top Editorial Folio Banner */}
      <header className="border-b border-[var(--paper-border)] bg-[var(--paper-canvas)]/90 backdrop-blur-xs px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between font-editorial-mono text-[10px] sm:text-[11px] tracking-widest uppercase text-[var(--ink-muted)]">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[var(--oxblood)]">I N K F O R G E</span>
            <span>•</span>
            <span className="hidden sm:inline">VOLUME IV MMXXVI</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleUnveilFullApp}
              className="inline-flex items-center space-x-1 font-editorial-sans text-[11px] uppercase tracking-wider text-[var(--ink-secondary)] hover:text-[var(--oxblood)] transition-colors"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Direct to Gazetteer</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Interactive Book Stage */}
      <main className="flex-1 flex items-center justify-center py-4 sm:py-8 px-2 sm:px-4">
        <PhysicalBook
          isOpen={bookState === "open"}
          isOpening={bookState === "opening"}
          onOpen={handleOpenBook}
          onClose={handleCloseBook}
          onSelectChapter={handleSelectChapter}
          onUnveilFullApp={handleUnveilFullApp}
        />
      </main>

      {/* Bottom Stage Footer */}
      <footer className="border-t border-[var(--paper-border)] py-4 px-4 text-center font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Continuous Press IF-2026</span>
          <span className="text-[var(--oxblood)] font-bold">
            Interactive Book Navigation System
          </span>
          <button
            onClick={handleUnveilFullApp}
            className="hover:underline text-[var(--ink-secondary)]"
          >
            Skip to Full Experience →
          </button>
        </div>
      </footer>

      {/* Chapter Modals */}
      <AuthorsModal
        isOpen={activeModal === "authors"}
        onClose={() => setActiveModal(null)}
      />
      <ColophonModal
        isOpen={activeModal === "colophon"}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}

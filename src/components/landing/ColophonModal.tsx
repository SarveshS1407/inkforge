"use client";

import { X, BookMarked, Sparkles } from "lucide-react";

interface ColophonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ColophonModal({ isOpen, onClose }: ColophonModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="colophon-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-6 sm:p-8 text-[var(--ink-primary)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--editorial-rule)] pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
              <BookMarked className="h-3 w-3" />
              <span>Colophon &amp; Manifesto • Chapter VI</span>
            </div>
            <h3 id="colophon-title" className="mt-1 font-editorial-serif text-2xl sm:text-3xl font-bold">
              The INKFORGE Manifesto
            </h3>
            <p className="mt-1 font-editorial-serif italic text-xs sm:text-sm text-[var(--ink-secondary)]">
              &ldquo;A living digital book for the modern internet.&rdquo;
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close colophon modal"
            className="rounded-md p-1.5 text-[var(--ink-muted)] hover:bg-[var(--paper-warm)] hover:text-[var(--ink-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-6 font-editorial-serif text-sm sm:text-base leading-relaxed text-[var(--ink-secondary)]">
          <div className="rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-5">
            <h4 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)] mb-2">
              The Three Tenets of Living Editorial
            </h4>
            <div className="space-y-3 text-sm">
              <p>
                <strong className="text-[var(--ink-primary)]">I. Enduring Gravity Over Ephemeral Noise.</strong>{" "}
                Digital feeds train minds toward rapid obsolescence. INKFORGE treats digital compositions with the same typographic dignity, archival reverence, and visual stillness as bound print literature.
              </p>
              <p>
                <strong className="text-[var(--ink-primary)]">II. Tactile Physicality Without Skeuomorphic Trap.</strong>{" "}
                We borrow from book design its greatest inventions: margins, folio numbering, dot-leader indexes, deckled rules, and paper warmth. We reject cheesy page-flipping sound effects or fake leather bindings.
              </p>
              <p>
                <strong className="text-[var(--ink-primary)]">III. Sovereign Local-First Authorship.</strong>{" "}
                A writer&apos;s thoughts belong to the author, not a cloud silo. Every draft written in INKFORGE persists in local browser memory instantly and unshakeably.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--paper-border)] bg-[var(--paper-warm)] p-5 text-xs font-editorial-mono space-y-2">
            <div className="font-bold uppercase tracking-wider text-[var(--oxblood)]">
              Technical Colophon
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--ink-secondary)]">
              <div><span className="text-[var(--ink-muted)]">Typefaces:</span> Charter, Bitstream, UI Monospace</div>
              <div><span className="text-[var(--ink-muted)]">Paper Stocks:</span> Cotton Ivory, Bookshop Vellum, Midnight Buckram</div>
              <div><span className="text-[var(--ink-muted)]">Engine:</span> Next.js 15, React 19, Tailwind CSS v4</div>
              <div><span className="text-[var(--ink-muted)]">Editor AST:</span> Tiptap ProseMirror Suite</div>
              <div><span className="text-[var(--ink-muted)]">Archival Horizon:</span> Designed for 2035 and beyond</div>
              <div><span className="text-[var(--ink-muted)]">Imprint:</span> Inkforge Press No. IF-2026</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-[var(--editorial-rule)] pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] transition-colors"
          >
            Return to Table of Contents
          </button>
        </div>
      </div>
    </div>
  );
}

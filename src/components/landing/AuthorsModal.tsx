"use client";

import { X, Feather, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

interface AuthorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AUTHORS = [
  {
    name: "Elena Rostova",
    role: "Chair of Architectural Studies",
    bio: "Researcher examining the long-term lifecycle of digital constructs. Believes software should outlive the hype cycle of individual technology vendors.",
    works: ["Crafting Systems That Endure (Vol. IV)", "On the Relational Calculus (Dispatch)"],
    featuredSlug: "crafting-systems-that-endure",
  },
  {
    name: "Marcus Chen",
    role: "Editorial Essayist & Digital Ecologist",
    bio: "Investigating the economics and sociology of independent writing. Champion for sovereign personal websites and digital garden autonomy.",
    works: ["The Rebirth of the Independent Web (Chapter II)", "Algorithmic Silence (Vol. III)"],
    featuredSlug: "the-death-and-rebirth-of-the-independent-web",
  },
  {
    name: "David Vance",
    role: "Principal Frontend Engineer",
    bio: "Typographic researcher and systems architect focusing on ProseMirror ASTs, dynamic block canvases, and classical layout mathematics in browsers.",
    works: ["The Architecture of Block Composition (Chapter III)", "Ambient E-Ink Surfaces (Note)"],
    featuredSlug: "block-based-composition-in-modern-publishing",
  },
  {
    name: "Sarah Lindqvist",
    role: "Staff Systems Fellow",
    bio: "Pioneer in local-first database replication, offline-first client storage, and conflict-free text synchronization for modern publishing suites.",
    works: ["The Scribe's Sanctuary: Local-First Draft Persistence (Dispatch IV)"],
    featuredSlug: "notes-on-local-first-autosave",
  },
];

export function AuthorsModal({ isOpen, onClose }: AuthorsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="authors-title"
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
              <Feather className="h-3 w-3" />
              <span>Resident Collegium • Chapter V</span>
            </div>
            <h3 id="authors-title" className="mt-1 font-editorial-serif text-2xl sm:text-3xl font-bold">
              Authors &amp; Editorial Fellows
            </h3>
            <p className="mt-1 font-editorial-serif italic text-xs sm:text-sm text-[var(--ink-secondary)]">
              The minds and essayists contributing to Volume IV of INKFORGE.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close authors modal"
            className="rounded-md p-1.5 text-[var(--ink-muted)] hover:bg-[var(--paper-warm)] hover:text-[var(--ink-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Authors Grid */}
        <div className="mt-6 space-y-6">
          {AUTHORS.map((author) => (
            <div
              key={author.name}
              className="rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-5 transition-shadow hover:shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                    {author.name}
                  </h4>
                  <p className="font-editorial-mono text-[11px] uppercase tracking-wider text-[var(--oxblood)]">
                    {author.role}
                  </p>
                </div>
                <Link
                  href={`/read/${author.featuredSlug}`}
                  onClick={onClose}
                  className="inline-flex items-center space-x-1 text-xs font-editorial-sans text-[var(--ink-muted)] hover:text-[var(--oxblood)] hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Read Monograph</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <p className="mt-3 font-editorial-serif text-sm leading-relaxed text-[var(--ink-secondary)]">
                {author.bio}
              </p>

              <div className="mt-4 border-t border-[var(--editorial-rule)] pt-3">
                <div className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                  Selected Inscriptions:
                </div>
                <ul className="mt-1 text-xs font-editorial-serif text-[var(--ink-secondary)] list-disc list-inside">
                  {author.works.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
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

import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <div className="font-editorial-mono text-xs font-bold uppercase tracking-widest text-[var(--oxblood)] mb-3">
          FOLIO NOT FOUND • ERROR 404
        </div>

        <h1 className="font-editorial-serif text-4xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)]">
          A Blank Leaf in the Archive
        </h1>

        <p className="mt-4 max-w-md font-editorial-serif italic text-base text-[var(--ink-secondary)] leading-relaxed">
          The requested monograph, chapter, or publication record does not exist in this edition or has been moved to an archival index.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Frontispiece</span>
          </Link>
          <Link
            href="/discover"
            className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] focus-visible:ring-offset-2"
          >
            Explore Discover
          </Link>
          <Link
            href="/write"
            className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] focus-visible:ring-offset-2"
          >
            Inscribe Manuscript
          </Link>
        </div>
      </main>
    </div>
  );
}

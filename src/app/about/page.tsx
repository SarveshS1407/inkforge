"use client";

import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import {
  Feather,
  BookOpen,
  ArrowRight,
  Compass,
  PenTool,
  CheckCircle2,
  Sparkles,
  Layers,
  Heart,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center space-x-2 font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
          <Link href="/" className="hover:text-[var(--oxblood)] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[var(--oxblood)] font-bold">About &amp; Philosophy</span>
        </div>

        {/* Masthead */}
        <header className="border-b border-[var(--editorial-rule)] pb-10 mb-12">
          <div className="inline-flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] mb-3 font-bold">
            <Feather className="h-4 w-4" />
            <span>Colophon &amp; Manifesto</span>
          </div>
          <h1 className="font-editorial-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.12]">
            On the Permanence of the Written Word
          </h1>
          <p className="font-editorial-serif text-lg sm:text-xl text-[var(--ink-secondary)] italic mt-4 leading-relaxed max-w-2xl">
            Why we built INKFORGE: reconciling the timeless craft of bookmaking with the living dynamism of modern software.
          </p>
        </header>

        {/* Core Manifesto Prose */}
        <article className="space-y-12 font-editorial-serif text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed">
          {/* Section 1: What is INKFORGE? */}
          <section className="space-y-4">
            <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
              What is INKFORGE?
            </h2>
            <p>
              INKFORGE is a place to <strong className="text-[var(--ink-primary)]">write, publish, discover, and read great work</strong>.
            </p>
            <p>
              It is neither an ephemeral social feed nor a sterile PDF viewer. Instead, it is an editorial sanctuary where writers compose distraction-free essays, readers immerse themselves in clean typography, and ideas are preserved with intentionality.
            </p>
          </section>

          {/* Section 2: Why Does It Exist? */}
          <section className="space-y-4 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8">
            <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
              Why does INKFORGE exist?
            </h2>
            <p>
              Modern internet publishing suffers from a bias toward the disposable. Platforms incentivize hot takes over deep contemplation, measure attention in volatile seconds, and lock words into algorithmic silos designed for advertising clicks.
            </p>
            <p className="italic text-[var(--oxblood)] font-medium">
              &ldquo;We wanted a home where sentences are treated with the gravity of literature rather than the disposability of an algorithmic stream.&rdquo;
            </p>
            <p>
              INKFORGE exists to prove that digital writing can possess the dignity, pacing, and typographic beauty of physical publication without sacrificing digital velocity.
            </p>
          </section>

          {/* Section 3: What Does the Name Mean? */}
          <section className="space-y-4">
            <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
              What does the name mean?
            </h2>
            <p>
              <strong className="text-[var(--ink-primary)] font-bold">INK</strong> represents permanence, physical touch, and the historical lineage of print—from early woodblock impressions to handset metal type and hand-bound journals.
            </p>
            <p>
              <strong className="text-[var(--ink-primary)] font-bold">FORGE</strong> represents heat, craft, and active creation. To forge is to take raw thoughts and shape them through discipline into durable structures.
            </p>
            <p>
              Together, <span className="font-editorial-mono text-sm tracking-wider uppercase text-[var(--oxblood)] font-bold">INKFORGE</span> is the workshop where ideas are struck into enduring form.
            </p>
          </section>

          {/* Section 4: The Idea Behind the Interface & Book Metaphor */}
          <section className="space-y-4 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-6 sm:p-8">
            <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
              The idea behind the interface
            </h2>
            <p>
              When you visit INKFORGE, you are greeted by an interactive, physical-style book resting on an ambient desk.
            </p>
            <p>
              This is our <strong className="text-[var(--ink-primary)]">brand entrance and emotional centerpiece</strong>. It reminds us of the sensory joy of cracking open a fresh volume: the buckram cloth binding, the headband at the spine, the deckled edge, and the calm of an uncluttered page.
            </p>
            <p>
              Yet the application around the book is crisp and modern: instantaneous local saving, fluid typography, clean discovery, and accessible navigation. We keep the soul of the book without trapping users inside a gimmick.
            </p>
          </section>

          {/* Section 5: Who is it for? */}
          <section className="space-y-4">
            <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
              Who is INKFORGE for?
            </h2>
            <div className="grid gap-4 sm:grid-cols-3 pt-2 font-editorial-sans text-xs">
              <div className="rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 space-y-2">
                <span className="font-editorial-mono text-[10px] uppercase text-[var(--oxblood)] font-bold block">
                  For Writers
                </span>
                <p className="text-[var(--ink-secondary)] leading-relaxed">
                  Authors, researchers, and essayists who want a distraction-free sanctuary that respects their sentences and saves every keystroke locally.
                </p>
              </div>

              <div className="rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 space-y-2">
                <span className="font-editorial-mono text-[10px] uppercase text-[var(--oxblood)] font-bold block">
                  For Readers
                </span>
                <p className="text-[var(--ink-secondary)] leading-relaxed">
                  Curious minds looking for longform writing without intrusive pop-ups, flashing banners, or noisy feeds.
                </p>
              </div>

              <div className="rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 space-y-2">
                <span className="font-editorial-mono text-[10px] uppercase text-[var(--oxblood)] font-bold block">
                  For Thinkers
                </span>
                <p className="text-[var(--ink-secondary)] leading-relaxed">
                  Anyone who believes that enduring digital tools should be built like cathedrals rather than temporary billboards.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Typographic Colophon */}
          <section className="border-t border-[var(--editorial-rule)] pt-8 space-y-3 font-editorial-mono text-xs text-[var(--ink-muted)]">
            <span className="text-[var(--oxblood)] font-bold uppercase tracking-widest block">
              Technical Colophon
            </span>
            <div className="grid gap-2 sm:grid-cols-2 pt-2">
              <div>
                <span className="text-[var(--ink-primary)] font-bold">Typography:</span> Charter (Serif Body), JetBrains Mono (Folios), Clean Modern Sans.
              </div>
              <div>
                <span className="text-[var(--ink-primary)] font-bold">Architecture:</span> Next.js, React 19, Tailwind CSS v4, Local-First Persistence.
              </div>
              <div>
                <span className="text-[var(--ink-primary)] font-bold">Materials:</span> Cotton Ivory, Bookshop Vellum, Midnight Buckram.
              </div>
              <div>
                <span className="text-[var(--ink-primary)] font-bold">Edition:</span> Volume IV • Continuous Editorial Press.
              </div>
            </div>
          </section>
        </article>

        {/* Return to Action Banner */}
        <div className="mt-12 pt-8 border-t border-[var(--editorial-rule)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-secondary)] hover:text-[var(--oxblood)] transition-colors"
          >
            ← Return to Homepage
          </Link>

          <div className="flex items-center space-x-3">
            <Link
              href="/discover"
              className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors"
            >
              Explore Discover
            </Link>
            <Link
              href="/write"
              className="rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] transition-colors"
            >
              Start Writing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

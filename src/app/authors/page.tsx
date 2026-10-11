"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { Users, Feather, BookOpen, ArrowRight, Clock, User } from "lucide-react";

interface AuthorProfile {
  name: string;
  role: string;
  affiliation: string;
  bio: string;
  monographCount: number;
  featuredStory: {
    slug: string;
    title: string;
    readingTime: string;
  };
}

interface InscribedAuthor {
  id: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role: string;
  createdAt: string;
  publishedCount: number;
}

const AUTHORS: AuthorProfile[] = [
  {
    name: "Elena Rostova",
    role: "Chair of Architectural Studies",
    affiliation: "Collegium of Systems & Permanence",
    bio: "Elena researches software permanence, relational database calculi, and long-horizon computing tools. Her writings advocate treating digital infrastructure with the gravitational dignity of classical architecture.",
    monographCount: 14,
    featuredStory: {
      slug: "crafting-systems-that-endure",
      title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
      readingTime: "6 min read",
    },
  },
  {
    name: "Marcus Chen",
    role: "Editorial Essayist & Digital Ecologist",
    affiliation: "Independent Web Fellowship",
    bio: "Marcus investigates the rebirth of sovereign digital publications, independent newsletters, and how authors can escape algorithmic engagement traps to cultivate thoughtful subscriber communities.",
    monographCount: 9,
    featuredStory: {
      slug: "the-death-and-rebirth-of-the-independent-web",
      title: "The Rebirth of the Independent Web: Why Writers Are Leaving Algorithmic Silos",
      readingTime: "4 min read",
    },
  },
  {
    name: "David Vance",
    role: "Principal Frontend Engineer",
    affiliation: "Inkforge Systems Lab",
    bio: "Specializing in Abstract Syntax Tree block editors, micro-typography algorithms, and ambient e-ink interfaces. David bridges the gap between historical print traditions and living digital web canvases.",
    monographCount: 11,
    featuredStory: {
      slug: "block-based-composition-in-modern-publishing",
      title: "The Architecture of Block Composition: From ProseMirror ASTs to Dynamic Canvases",
      readingTime: "8 min read",
    },
  },
  {
    name: "Sarah Lindqvist",
    role: "Staff Fellow",
    affiliation: "Distributed State & Resilient Storage",
    bio: "Sarah focuses on local-first draft architectures, offline-first composition, and cryptographic verification of published document trees across distributed peer networks.",
    monographCount: 6,
    featuredStory: {
      slug: "notes-on-local-first-autosave",
      title: "The Scribe's Sanctuary: Local-First Draft Persistence in Uncertain Networks",
      readingTime: "5 min read",
    },
  },
];

export default function AuthorsPage() {
  const [registeredAuthors, setRegisteredAuthors] = useState<InscribedAuthor[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadAuthors() {
      try {
        const res = await fetch("/api/v1/authors");
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data)) {
          setRegisteredAuthors(json.data);
        }
      } catch {
        // Fallback to static fellows
      }
    }
    loadAuthors();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center space-x-2 font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
          <Link href="/" className="hover:text-[var(--oxblood)] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[var(--oxblood)] font-bold">Resident Authors</span>
        </div>

        {/* Masthead */}
        <header className="border-b border-[var(--editorial-rule)] pb-10 mb-10">
          <div className="inline-flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] mb-3 font-bold">
            <Users className="h-4 w-4" />
            <span>The Collegium</span>
          </div>
          <h1 className="font-editorial-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.12]">
            Resident Authors &amp; Fellows
          </h1>
          <p className="font-editorial-serif text-lg text-[var(--ink-secondary)] italic mt-3 max-w-2xl">
            Discover the thinkers, researchers, and essayists publishing longform work across the INKFORGE catalog.
          </p>
        </header>

        {/* Registered Inscribed Authors (Live from Database) */}
        {registeredAuthors.length > 0 && (
          <section className="mb-14">
            <div className="mb-6 border-b border-[var(--editorial-rule)] pb-3 flex items-baseline justify-between">
              <div>
                <span className="font-editorial-mono text-xs font-bold uppercase tracking-widest text-[var(--oxblood)]">
                  Live Registry
                </span>
                <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                  Inscribed Scribes &amp; Authors
                </h2>
              </div>
              <span className="font-editorial-mono text-xs text-[var(--ink-muted)]">
                {registeredAuthors.length} registered
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
              {registeredAuthors.map((author) => (
                <Link
                  key={author.id}
                  href={`/authors/${author.username}`}
                  className="book-jacket group rounded-xl p-6 transition-all hover:border-[var(--oxblood)] shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--oxblood-subtle)] border border-[var(--oxblood)] font-editorial-serif font-bold text-lg text-[var(--oxblood)] shadow-2xs">
                        {author.displayName[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors line-clamp-1">
                          {author.displayName}
                        </h3>
                        <p className="font-editorial-mono text-xs text-[var(--ink-muted)]">
                          @{author.username}
                        </p>
                      </div>
                    </div>

                    <p className="font-editorial-serif text-xs text-[var(--ink-secondary)] italic line-clamp-2 leading-relaxed">
                      {author.bio || "Inscribed author at the INKFORGE Publishing Sanctuary."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--editorial-rule)] flex items-center justify-between font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                    <span className="text-[var(--oxblood)] font-semibold">
                      {author.publishedCount} Published Folio{author.publishedCount === 1 ? "" : "s"}
                    </span>
                    <span className="text-[var(--oxblood)] font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>View Folio →</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Curated Fellows Header */}
        <div className="mb-6 border-b border-[var(--editorial-rule)] pb-3">
          <span className="font-editorial-mono text-xs font-bold uppercase tracking-widest text-[var(--oxblood)]">
            Fellowship Archive
          </span>
          <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
            Founding Editorial Fellows
          </h2>
        </div>

        {/* Authors Grid */}
        <section className="grid gap-6 md:grid-cols-2 mb-12">
          {AUTHORS.map((author, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs hover:border-[var(--oxblood)]/50 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                      {author.name}
                    </h2>
                    <p className="font-editorial-mono text-[11px] uppercase tracking-wider text-[var(--oxblood)] font-semibold mt-0.5">
                      {author.role}
                    </p>
                    <p className="font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--ink-muted)]">
                      {author.affiliation}
                    </p>
                  </div>

                  <span className="rounded-full bg-[var(--paper-warm)] px-3 py-1 font-editorial-mono text-[10px] text-[var(--ink-secondary)] border border-[var(--paper-border)]">
                    {author.monographCount} Works
                  </span>
                </div>

                <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] leading-relaxed">
                  {author.bio}
                </p>
              </div>

              {/* Featured Monograph */}
              <div className="border-t border-[var(--editorial-rule)] pt-4 space-y-2">
                <span className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] font-bold block">
                  Featured Monograph:
                </span>
                <Link
                  href={`/read/${author.featuredStory.slug}`}
                  className="group flex items-center justify-between p-3 rounded-lg bg-[var(--paper-canvas)] border border-[var(--paper-border)] hover:border-[var(--oxblood)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oxblood)]"
                >
                  <span className="font-editorial-serif font-bold text-xs sm:text-sm text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] line-clamp-1 transition-colors">
                    {author.featuredStory.title}
                  </span>
                  <span className="font-editorial-sans text-xs text-[var(--oxblood)] font-semibold shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform">
                    Read →
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* Join as an Author CTA */}
        <section className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-8 text-center space-y-3">
          <span className="font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] font-bold">
            Write on INKFORGE
          </span>
          <h3 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
            Are you crafting long-horizon work?
          </h3>
          <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] max-w-lg mx-auto">
            INKFORGE is open to all authors, independent researchers, and essayists who care about their words.
          </p>
          <div className="pt-2">
            <Link
              href="/write"
              className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-6 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] focus-visible:ring-offset-2"
            >
              <span>Open Scribe Studio &amp; Begin Drafting</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

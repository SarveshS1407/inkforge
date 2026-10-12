"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  Users,
  Feather,
  BookOpen,
  ArrowRight,
  Clock,
  Calendar,
  Globe,
  MapPin,
  Edit3,
  PenTool,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PublicAuthorResponse } from "@/types/api";

export default function PublicAuthorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolvedParams = use(params);
  const username = resolvedParams.username;

  const [author, setAuthor] = useState<PublicAuthorResponse | null>(null);
  const [currentUserUsername, setCurrentUserUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAuthorAndAuth() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch public author data
        const authorRes = await fetch(`/api/v1/authors/${encodeURIComponent(username)}`);
        if (!authorRes.ok) {
          if (authorRes.status === 404) {
            if (isMounted) setError("Author folio not found.");
            return;
          }
          throw new Error("Failed to load author folio.");
        }

        const authorJson = await authorRes.json();
        if (authorJson.success && authorJson.data) {
          if (isMounted) setAuthor(authorJson.data);
        } else {
          if (isMounted) setError(authorJson.error?.message || "Author folio not found.");
        }

        // 2. Fetch authenticated user to check ownership
        try {
          const meRes = await fetch("/api/v1/auth/me");
          if (meRes.ok) {
            const meJson = await meRes.json();
            if (meJson.success && meJson.data?.username) {
              if (isMounted) setCurrentUserUsername(meJson.data.username);
            }
          }
        } catch {
          // Unauthenticated viewer
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load author profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAuthorAndAuth();

    return () => {
      isMounted = false;
    };
  }, [username]);

  const isOwner = currentUserUsername && author && currentUserUsername.toLowerCase() === author.username.toLowerCase();

  // Progressive GPU-accelerated scroll reveals
  useScrollReveal([author]);

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
          <Link href="/authors" className="hover:text-[var(--oxblood)] transition-colors">
            Resident Authors
          </Link>
          <span>/</span>
          <span className="text-[var(--oxblood)] font-bold">@{username}</span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-24 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--oxblood)]" />
            <p className="mt-3 font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
              Consulting the Author Registry...
            </p>
          </div>
        )}

        {/* 404 / Error State */}
        {!isLoading && (error || !author) && (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--paper-warm)] border border-[var(--paper-border)] text-[var(--oxblood)] mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h2 className="font-editorial-serif text-3xl font-bold text-[var(--ink-primary)]">
              Author Folio Not Found
            </h2>
            <p className="mt-2 font-editorial-serif text-base italic text-[var(--ink-secondary)] max-w-md mx-auto">
              The author handle &ldquo;@{username}&rdquo; is not inscribed in the INKFORGE registry, or has chosen a different pseudonym.
            </p>
            <div className="mt-6 flex justify-center gap-4 font-editorial-sans text-xs uppercase tracking-wider">
              <Link
                href="/authors"
                className="rounded-md bg-[var(--oxblood)] px-4 py-2 font-semibold text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all"
              >
                Browse Resident Authors
              </Link>
              <Link
                href="/"
                className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2 font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-all"
              >
                Return Home
              </Link>
            </div>
          </div>
        )}

        {/* Author Profile Content */}
        {!isLoading && author && (
          <div>
            {/* Author Profile Header Card: Pop-in reveal */}
            <section className="scroll-pop-reveal book-jacket rounded-xl p-8 sm:p-10 mb-12 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-[var(--editorial-rule)]">
                <div className="flex items-start sm:items-center space-x-5">
                  {/* Monogram / Avatar */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--oxblood-subtle)] border-2 border-[var(--oxblood)] font-editorial-serif font-bold text-3xl text-[var(--oxblood)] shadow-xs">
                    {author.displayName ? author.displayName[0].toUpperCase() : author.username[0].toUpperCase()}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-editorial-mono text-[11px] font-bold uppercase tracking-widest text-[var(--oxblood)]">
                        {author.role === "WRITER" ? "Registered Author" : author.role}
                      </span>
                      {isOwner && (
                        <span className="rounded bg-[var(--amber-gold)]/20 px-2 py-0.5 font-editorial-mono text-[9px] font-bold uppercase tracking-wider text-[var(--amber-gold)] border border-[var(--amber-gold)]/40">
                          Your Author Folio
                        </span>
                      )}
                    </div>

                    <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink-primary)] leading-tight">
                      {author.displayName}
                    </h1>

                    <p className="font-editorial-mono text-xs text-[var(--ink-muted)] mt-0.5">
                      @{author.username}
                    </p>
                  </div>
                </div>

                {/* Owner Actions */}
                {isOwner && (
                  <div className="flex flex-wrap gap-2 sm:self-center">
                    <Link
                      href="/profile"
                      className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3.5 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-all shadow-2xs"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                      <span>Edit Profile</span>
                    </Link>
                    <Link
                      href="/write"
                      className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-3.5 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] transition-all shadow-xs"
                    >
                      <PenTool className="h-3.5 w-3.5" />
                      <span>Studio</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Bio & Details */}
              <div className="pt-6 space-y-4">
                <p className="font-editorial-serif text-lg leading-relaxed text-[var(--ink-secondary)] italic max-w-3xl">
                  {author.bio || "Author and essayist in the INKFORGE publishing sanctuary."}
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-2 font-editorial-mono text-xs text-[var(--ink-muted)]">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                    <span>
                      Inscribed {new Date(author.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {author.location && (
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[var(--amber-gold)]" />
                      <span>{author.location}</span>
                    </div>
                  )}

                  {author.websiteUrl && (
                    <a
                      href={author.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1.5 text-[var(--oxblood)] hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Website</span>
                    </a>
                  )}

                  <div className="flex items-center space-x-1.5 text-[var(--ink-primary)] font-semibold">
                    <BookOpen className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                    <span>{author.posts.length} Published Monograph{author.posts.length === 1 ? "" : "s"}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Published Works Section */}
            <section className="mb-16">
              <div className="mb-6 flex items-baseline justify-between border-b border-[var(--editorial-rule)] pb-3">
                <div>
                  <span className="font-editorial-mono text-xs font-bold uppercase tracking-widest text-[var(--oxblood)]">
                    Public Archive
                  </span>
                  <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                    Published Monographs &amp; Folios
                  </h2>
                </div>
                <span className="font-editorial-mono text-xs text-[var(--ink-muted)]">
                  {author.posts.length} {author.posts.length === 1 ? "work" : "works"}
                </span>
              </div>

              {author.posts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {author.posts.map((post, idx) => (
                    <article
                      key={post.id}
                      style={{ "--stagger-index": idx % 6 } as React.CSSProperties}
                      className="scroll-stagger-child book-jacket group flex flex-col justify-between rounded-xl p-6 transition-all hover:border-[var(--oxblood)] shadow-xs"
                    >
                      <div>
                        <div className="mb-2 flex items-center justify-between font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                          <span className="font-bold text-[var(--oxblood)]">
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Published"}
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{post.readingTimeMinutes} min read</span>
                          </span>
                        </div>

                        <Link
                          href={`/read/${post.slug}`}
                          className="focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] rounded-xs block"
                        >
                          <h3 className="font-editorial-serif text-xl font-bold leading-snug text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors">
                            {post.title}
                          </h3>
                        </Link>

                        {post.subtitle && (
                          <p className="mt-1.5 font-editorial-serif italic text-xs text-[var(--ink-secondary)]">
                            {post.subtitle}
                          </p>
                        )}

                        {post.excerpt && (
                          <p className="mt-3 line-clamp-3 font-editorial-serif text-sm leading-relaxed text-[var(--ink-secondary)]">
                            {post.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-[var(--editorial-rule)] flex items-center justify-between">
                        <span className="font-editorial-mono text-[10px] uppercase text-[var(--ink-muted)]">
                          Public Archive
                        </span>
                        <Link
                          href={`/read/${post.slug}`}
                          className="font-editorial-mono text-xs font-bold uppercase tracking-wider text-[var(--oxblood)] hover:underline inline-flex items-center space-x-1"
                        >
                          <span>Open Folio</span>
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="rounded-xl border border-dashed border-[var(--paper-border)] bg-[var(--paper-warm)] p-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--paper-surface)] border border-[var(--paper-border)] text-[var(--oxblood)] mb-3">
                    <Feather className="h-6 w-6" />
                  </div>
                  <h3 className="font-editorial-serif text-xl font-bold text-[var(--ink-primary)]">
                    No Monographs Yet Inscribed
                  </h3>
                  <p className="mt-1.5 font-editorial-serif text-sm italic text-[var(--ink-secondary)] max-w-md mx-auto">
                    This author is currently composing manuscripts in the private Scribe Studio. Check back soon for released publications.
                  </p>
                  {isOwner && (
                    <div className="mt-6">
                      <Link
                        href="/write"
                        className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all"
                      >
                        <PenTool className="h-3.5 w-3.5" />
                        <span>Inscribe Your First Monograph</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

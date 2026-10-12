"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  Layers,
  BookOpen,
  ArrowRight,
  Clock,
  Feather,
  Bookmark,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Globe,
  Loader2,
  AlertCircle,
  X,
  Check,
  FolderPlus,
  Search,
} from "lucide-react";

interface CollectionPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  readingTimeMinutes: number;
  publishedAt: string | null;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  publication?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface CollectionItemDetail {
  id: string;
  orderIndex: number;
  addedAt: string;
  post: CollectionPost;
}

interface CollectionData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  items?: CollectionItemDetail[];
  itemCount?: number;
  _count?: { items: number };
  isOwner?: boolean;
}

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<"public" | "mine">("public");
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [activeCollectionDetails, setActiveCollectionDetails] = useState<CollectionData | null>(null);

  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);

  // Load current authenticated user
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setCurrentUser(json.data);
          }
        }
      } catch {
        // Unauthenticated
      }
    }
    checkUser();
  }, []);

  // Fetch collections list
  const fetchCollections = useCallback(async (tab: "public" | "mine") => {
    setIsLoadingList(true);
    setError(null);
    try {
      const url =
        tab === "mine"
          ? "/api/v1/collections?mine=true&limit=50"
          : "/api/v1/collections?limit=50";

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCollections(json.data);
          if (json.data.length > 0) {
            // Keep active or select first
            setActiveCollectionId((prev) =>
              prev && json.data.some((c: any) => c.id === prev) ? prev : json.data[0].id
            );
          } else {
            setActiveCollectionId(null);
            setActiveCollectionDetails(null);
          }
        }
      } else {
        setError("Failed to load collections.");
      }
    } catch {
      setError("Network error loading collections.");
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections(activeTab);
  }, [activeTab, fetchCollections]);

  // Fetch active collection details
  useEffect(() => {
    if (!activeCollectionId) return;

    let isMounted = true;
    setIsLoadingDetails(true);

    async function loadDetails() {
      try {
        const res = await fetch(`/api/v1/collections/${activeCollectionId}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.data) {
            setActiveCollectionDetails(json.data);
          }
        }
      } catch {
        // Detail fetch error
      } finally {
        if (isMounted) setIsLoadingDetails(false);
      }
    }

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [activeCollectionId]);

  // Handle Create Collection
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          isPublic: newIsPublic,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setCreateModalOpen(false);
        setNewTitle("");
        setNewDescription("");
        setActiveTab("mine");
        await fetchCollections("mine");
        setActiveCollectionId(json.data.id);
      } else {
        setError(json.error?.message || "Failed to create collection.");
      }
    } catch {
      setError("Network error creating collection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Collection
  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollectionId || !editTitle.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/collections/${activeCollectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          isPublic: editIsPublic,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setEditModalOpen(false);
        await fetchCollections(activeTab);
        setActiveCollectionDetails((prev) => (prev ? { ...prev, ...json.data } : json.data));
      } else {
        setError(json.error?.message || "Failed to update collection.");
      }
    } catch {
      setError("Network error updating collection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Collection
  const handleDeleteCollection = async (col: CollectionData) => {
    const confirmDelete = window.confirm(
      `Are you sure you wish to delete collection "${col.title}"? Works inside it will not be deleted from the archive.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/v1/collections/${col.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchCollections(activeTab);
      } else {
        const json = await res.json();
        alert(json.error?.message || "Failed to delete collection.");
      }
    } catch {
      alert("Network error deleting collection.");
    }
  };

  // Handle Remove Item
  const handleRemoveItem = async (postId: string) => {
    if (!activeCollectionId) return;

    try {
      const res = await fetch(`/api/v1/collections/${activeCollectionId}/items/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Refresh detail
        setActiveCollectionDetails((prev) => {
          if (!prev || !prev.items) return prev;
          const filtered = prev.items.filter((item) => item.post.id !== postId);
          return {
            ...prev,
            items: filtered,
            itemCount: filtered.length,
          };
        });
        // Update list item count
        setCollections((prev) =>
          prev.map((c) =>
            c.id === activeCollectionId
              ? {
                  ...c,
                  _count: {
                    items: Math.max(0, (c._count?.items ?? 1) - 1),
                  },
                }
              : c
          )
        );
      }
    } catch {
      alert("Failed to remove monograph from collection.");
    }
  };

  const isCurrentCollectionOwner =
    Boolean(currentUser && activeCollectionDetails && activeCollectionDetails.ownerId === currentUser.id);

  // Progressive GPU-accelerated scroll reveals
  useScrollReveal([collections, activeTab, activeCollectionDetails]);

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
          <span className="text-[var(--oxblood)] font-bold">Curated Collections</span>
        </div>

        {/* Masthead */}
        <header className="scroll-ink-reveal border-b border-[var(--editorial-rule)] pb-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] mb-2 font-bold">
                <Layers className="h-4 w-4" />
                <span>Anthologies &amp; Reading Lists</span>
              </div>
              <h1 className="font-editorial-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.12]">
                Curated Collections
              </h1>
              <p className="font-editorial-serif text-lg text-[var(--ink-secondary)] italic mt-2 max-w-2xl">
                Explore monographs, treatises, and personal anthologies organized around enduring ideas and publishing traditions.
              </p>
            </div>

            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  setNewTitle("");
                  setNewDescription("");
                  setNewIsPublic(true);
                  setCreateModalOpen(true);
                }}
                className="self-start sm:self-auto inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2.5 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Collection</span>
              </button>
            )}
          </div>

          {/* View Tabs */}
          <div className="mt-8 flex items-center space-x-3 font-editorial-mono text-xs uppercase tracking-wider border-t border-[var(--editorial-rule)] pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("public")}
              className={`px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                activeTab === "public"
                  ? "bg-[var(--oxblood)] text-white border-[var(--oxblood)] font-bold shadow-2xs"
                  : "bg-[var(--paper-surface)] text-[var(--ink-secondary)] border-[var(--paper-border)] hover:border-[var(--oxblood)]"
              }`}
            >
              Public Anthologies
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={() => setActiveTab("mine")}
                className={`px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                  activeTab === "mine"
                    ? "bg-[var(--oxblood)] text-white border-[var(--oxblood)] font-bold shadow-2xs"
                    : "bg-[var(--paper-surface)] text-[var(--ink-secondary)] border-[var(--paper-border)] hover:border-[var(--oxblood)]"
                }`}
              >
                My Reading Lists
              </button>
            )}
          </div>
        </header>

        {/* Error notification */}
        {error && (
          <div className="mb-6 rounded-lg border border-[var(--oxblood)]/40 bg-[var(--oxblood-subtle)] p-3 text-xs text-[var(--oxblood)] flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Collections Explorer Layout (Sidebar 5 cols + Detail 7 cols) */}
        {isLoadingList ? (
          <div className="py-16 text-center space-y-3 font-editorial-mono text-xs text-[var(--ink-muted)]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--oxblood)] mx-auto" />
            <span>Retrieving collections from the archive...</span>
          </div>
        ) : collections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--paper-border)] bg-[var(--paper-surface)] p-12 text-center space-y-4">
            <Layers className="h-10 w-10 text-[var(--ink-muted)] mx-auto opacity-50" />
            <h3 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
              {activeTab === "mine" ? "You Have No Collections Yet" : "No Public Collections Inscribed"}
            </h3>
            <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] max-w-md mx-auto">
              {activeTab === "mine"
                ? "Create a reading list or anthology to organize monographs and essays as you browse."
                : "Be the first to curate an anthology and share your literary perspective with readers."}
            </p>
            {currentUser && (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-2xs hover:bg-[var(--oxblood-hover)] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Collection</span>
              </button>
            )}
          </div>
        ) : (
          <section className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Collection Selector Sidebar (5 cols): Emerges from left */}
            <div className="scroll-emerge-left lg:col-span-5 space-y-3">
              <span className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold block mb-2">
                {activeTab === "mine" ? "Your Reading Lists" : "Curated Anthologies"} ({collections.length})
              </span>

              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                {collections.map((col, idx) => {
                  const isSelected = activeCollectionId === col.id;
                  const count = col._count?.items ?? col.itemCount ?? 0;

                  return (
                    <div
                      key={col.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() => setActiveCollectionId(col.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveCollectionId(col.id);
                        }
                      }}
                      style={{ "--stagger-index": idx % 6 } as React.CSSProperties}
                      className={`scroll-stagger-child group relative rounded-xl border p-5 transition-all cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] ${
                        isSelected
                          ? "border-[var(--oxblood)] bg-[var(--paper-surface)] shadow-md ring-1 ring-[var(--oxblood)]"
                          : "border-[var(--paper-border)] bg-[var(--paper-surface)]/60 hover:border-[var(--oxblood)]/50 hover:bg-[var(--paper-surface)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 font-editorial-mono text-[10px] uppercase tracking-widest">
                        <span className="text-[var(--oxblood)] font-bold">
                          VOL. {idx + 1}
                        </span>
                        <div className="flex items-center space-x-2 text-[var(--ink-muted)]">
                          {!col.isPublic && (
                            <span title="Private Collection" className="flex items-center space-x-0.5 text-amber-600 dark:text-amber-400">
                              <Lock className="h-3 w-3" />
                              <span className="text-[9px]">Private</span>
                            </span>
                          )}
                          <span>{count} {count === 1 ? "Work" : "Works"}</span>
                        </div>
                      </div>

                      <h3 className="font-editorial-serif text-lg sm:text-xl font-bold text-[var(--ink-primary)]">
                        {col.title}
                      </h3>

                      {col.description && (
                        <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)] mt-1.5 line-clamp-2">
                          {col.description}
                        </p>
                      )}

                      <div className="mt-3 pt-2.5 border-t border-[var(--editorial-rule)] flex items-center justify-between font-editorial-sans text-[11px] text-[var(--ink-muted)]">
                        <span>Curated by {col.owner.displayName || col.owner.username}</span>
                        <span className="text-[var(--oxblood)] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center">
                          View →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Collection Detail & Reading List (7 cols): Emerges from right */}
            <div className="scroll-emerge-right lg:col-span-7">
              {isLoadingDetails ? (
                <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-12 text-center space-y-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--oxblood)] mx-auto" />
                  <span className="font-editorial-mono text-xs text-[var(--ink-muted)]">
                    Loading anthology folios...
                  </span>
                </div>
              ) : activeCollectionDetails ? (
                <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in">
                  <div>
                    <div className="flex items-center justify-between font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] font-bold mb-2">
                      <div className="flex items-center space-x-2">
                        <span>ANTHOLOGY FOLIO</span>
                        {!activeCollectionDetails.isPublic && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            <Lock className="h-2.5 w-2.5" />
                            <span>Private</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-[var(--ink-muted)]">
                        <span>
                          {activeCollectionDetails.itemCount ?? activeCollectionDetails.items?.length ?? 0} Works
                        </span>

                        {isCurrentCollectionOwner && (
                          <div className="flex items-center space-x-1 border-l border-[var(--editorial-rule)] pl-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditTitle(activeCollectionDetails.title);
                                setEditDescription(activeCollectionDetails.description || "");
                                setEditIsPublic(activeCollectionDetails.isPublic);
                                setEditModalOpen(true);
                              }}
                              className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors cursor-pointer"
                              title="Edit Collection"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCollection(activeCollectionDetails)}
                              className="p-1 rounded text-[var(--ink-muted)] hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Collection"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
                      {activeCollectionDetails.title}
                    </h2>

                    {activeCollectionDetails.description && (
                      <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] mt-3 leading-relaxed">
                        {activeCollectionDetails.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center space-x-2 font-editorial-mono text-[11px] text-[var(--ink-muted)]">
                      <span>Curated by</span>
                      <Link
                        href={`/authors/${activeCollectionDetails.owner.username}`}
                        className="font-bold text-[var(--oxblood)] hover:underline"
                      >
                        {activeCollectionDetails.owner.displayName || activeCollectionDetails.owner.username}
                      </Link>
                    </div>
                  </div>

                  {/* List of items */}
                  <div className="border-t border-[var(--editorial-rule)] pt-6 space-y-4">
                    <span className="font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-bold block">
                      Works in this Anthology
                    </span>

                    {!activeCollectionDetails.items || activeCollectionDetails.items.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[var(--paper-border)] bg-[var(--paper-warm)] p-6 text-center space-y-2">
                        <BookOpen className="h-6 w-6 text-[var(--ink-muted)] mx-auto opacity-50" />
                        <p className="font-editorial-serif font-bold text-sm text-[var(--ink-primary)]">
                          Anthology is currently empty
                        </p>
                        <p className="font-editorial-sans text-xs text-[var(--ink-secondary)] max-w-sm mx-auto">
                          Browse published monographs in Discover or Reader folios and bookmark them into this anthology.
                        </p>
                        <div className="pt-2">
                          <Link
                            href="/discover"
                            className="inline-flex items-center space-x-1.5 font-editorial-sans text-xs text-[var(--oxblood)] font-bold hover:underline"
                          >
                            <span>Browse Discover Catalog →</span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeCollectionDetails.items.map((item) => (
                          <div
                            key={item.id}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-canvas)] transition-all hover:border-[var(--oxblood)] hover:shadow-xs"
                          >
                            <div className="space-y-1 flex-1 pr-3">
                              <Link
                                href={`/read/${item.post.slug}`}
                                className="font-editorial-serif font-bold text-sm sm:text-base text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors line-clamp-1"
                              >
                                {item.post.title}
                              </Link>
                              <div className="flex items-center space-x-2 text-xs font-editorial-sans text-[var(--ink-muted)]">
                                <span>
                                  By{" "}
                                  <Link
                                    href={`/authors/${item.post.author.username}`}
                                    className="hover:underline text-[var(--ink-secondary)]"
                                  >
                                    {item.post.author.displayName || item.post.author.username}
                                  </Link>
                                </span>
                                {item.post.publication && (
                                  <>
                                    <span>•</span>
                                    <span>{item.post.publication.name}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="mt-2 sm:mt-0 flex items-center space-x-3 text-xs font-editorial-mono text-[var(--ink-muted)] shrink-0">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{item.post.readingTimeMinutes || 4} min read</span>
                              </span>

                              <Link
                                href={`/read/${item.post.slug}`}
                                className="font-editorial-sans text-[var(--oxblood)] font-semibold inline-flex items-center group-hover:translate-x-1 transition-transform"
                              >
                                Read →
                              </Link>

                              {isCurrentCollectionOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.post.id)}
                                  className="p-1 rounded text-[var(--ink-muted)] hover:text-red-600 transition-colors cursor-pointer"
                                  title="Remove from collection"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footnote */}
                  <div className="border-t border-[var(--editorial-rule)] pt-4 flex items-center justify-between font-editorial-mono text-[10px] uppercase text-[var(--ink-muted)]">
                    <span>Continuous Press Folios</span>
                    <Link href="/discover" className="text-[var(--oxblood)] hover:underline font-bold">
                      Explore More Monographs →
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        )}
      </main>

      {/* CREATE COLLECTION MODAL */}
      {createModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3">
              <div className="flex items-center space-x-2">
                <FolderPlus className="h-4 w-4 text-[var(--oxblood)]" />
                <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                  Create Anthology
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block font-editorial-mono text-[10px] uppercase font-bold text-[var(--ink-secondary)] mb-1">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={100}
                  placeholder="e.g. Architectural Foundations &amp; Craft"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 text-base sm:text-sm font-editorial-sans text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-editorial-mono text-[10px] uppercase font-bold text-[var(--ink-secondary)] mb-1">
                  Description / Synopsis (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="A brief explanation of the thematic vision of this collection..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 text-base sm:text-sm font-editorial-sans text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-warm)]">
                <div>
                  <span className="font-editorial-sans text-xs font-bold text-[var(--ink-primary)] block">
                    Public Anthology
                  </span>
                  <span className="font-editorial-sans text-[11px] text-[var(--ink-muted)]">
                    Make this reading list discoverable by fellow readers.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newIsPublic}
                  onChange={(e) => setNewIsPublic(e.target.checked)}
                  className="h-4 w-4 accent-[var(--oxblood)] rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-editorial-sans text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-1.5 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-2xs hover:bg-[var(--oxblood-hover)] cursor-pointer disabled:opacity-40"
                >
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  <span>Create Collection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COLLECTION MODAL */}
      {editModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="h-4 w-4 text-[var(--oxblood)]" />
                <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                  Edit Collection Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCollection} className="space-y-4">
              <div>
                <label className="block font-editorial-mono text-[10px] uppercase font-bold text-[var(--ink-secondary)] mb-1">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={100}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 text-base sm:text-sm font-editorial-sans text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-editorial-mono text-[10px] uppercase font-bold text-[var(--ink-secondary)] mb-1">
                  Description / Synopsis
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 text-base sm:text-sm font-editorial-sans text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-warm)]">
                <div>
                  <span className="font-editorial-sans text-xs font-bold text-[var(--ink-primary)] block">
                    Public Anthology
                  </span>
                  <span className="font-editorial-sans text-[11px] text-[var(--ink-muted)]">
                    Make this reading list discoverable by fellow readers.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="h-4 w-4 accent-[var(--oxblood)] rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-editorial-sans text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editTitle.trim()}
                  className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-1.5 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-2xs hover:bg-[var(--oxblood-hover)] cursor-pointer disabled:opacity-40"
                >
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

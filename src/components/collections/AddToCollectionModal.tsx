"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bookmark,
  X,
  Plus,
  Check,
  Loader2,
  Lock,
  Globe,
  Layers,
  AlertCircle,
  FolderPlus,
} from "lucide-react";

interface CollectionSummary {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
  itemCount: number;
  hasPost: boolean;
  updatedAt: string;
}

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle?: string;
  onRequireAuth?: () => void;
}

export function AddToCollectionModal({
  isOpen,
  onClose,
  postId,
  postTitle,
  onRequireAuth,
}: AddToCollectionModalProps) {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New Collection inline form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const fetchCollections = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/collections/by-post/${postId}`);
      if (res.status === 401) {
        if (onRequireAuth) {
          onClose();
          onRequireAuth();
          return;
        }
        setError("Please sign in to organize works into collections.");
        return;
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCollections(json.data);
      } else {
        setError(json.error?.message || "Failed to load your collections.");
      }
    } catch {
      setError("Network error loading collections.");
    } finally {
      setIsLoading(false);
    }
  }, [postId, onClose, onRequireAuth]);

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
      setIsCreating(false);
      setNewTitle("");
      setNewDescription("");
    }
  }, [isOpen, fetchCollections]);

  const handleToggleItem = async (col: CollectionSummary) => {
    setUpdatingId(col.id);
    setError(null);

    try {
      if (col.hasPost) {
        // Remove
        const res = await fetch(`/api/v1/collections/${col.id}/items/${postId}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (json.success) {
          setCollections((prev) =>
            prev.map((c) =>
              c.id === col.id
                ? { ...c, hasPost: false, itemCount: Math.max(0, c.itemCount - 1) }
                : c
            )
          );
        } else {
          setError(json.error?.message || "Failed to remove from collection.");
        }
      } else {
        // Add
        const res = await fetch(`/api/v1/collections/${col.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });
        const json = await res.json();
        if (json.success) {
          setCollections((prev) =>
            prev.map((c) =>
              c.id === col.id
                ? { ...c, hasPost: true, itemCount: c.itemCount + 1 }
                : c
            )
          );
        } else {
          setError(json.error?.message || "Failed to add to collection.");
        }
      }
    } catch {
      setError("Network error updating collection membership.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmittingNew(true);
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
      if (json.success && json.data) {
        const newColId = json.data.id;
        // Automatically add current post to the newly created collection!
        await fetch(`/api/v1/collections/${newColId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });

        setIsCreating(false);
        setNewTitle("");
        setNewDescription("");
        await fetchCollections();
      } else {
        setError(json.error?.message || "Failed to create collection.");
      }
    } catch {
      setError("Network error creating collection.");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-md bg-[var(--oxblood-subtle)] text-[var(--oxblood)]">
              <Bookmark className="h-4 w-4" />
            </div>
            <div>
              <h3
                id="collection-dialog-title"
                className="font-editorial-serif text-base font-bold text-[var(--ink-primary)]"
              >
                Save to Collection
              </h3>
              {postTitle && (
                <p className="font-editorial-serif italic text-xs text-[var(--ink-muted)] line-clamp-1 max-w-[280px]">
                  &ldquo;{postTitle}&rdquo;
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="rounded-lg border border-[var(--oxblood)]/40 bg-[var(--oxblood-subtle)] p-3 text-xs text-[var(--oxblood)] flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2 text-xs font-editorial-mono text-[var(--ink-muted)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--oxblood)]" />
            <span>Retrieving your collections...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* List of collections */}
            {collections.length === 0 && !isCreating ? (
              <div className="py-6 text-center space-y-2 rounded-lg border border-dashed border-[var(--paper-border)] bg-[var(--paper-warm)] p-4">
                <Layers className="h-6 w-6 text-[var(--ink-muted)] mx-auto opacity-60" />
                <p className="font-editorial-serif font-bold text-sm text-[var(--ink-primary)]">
                  No collections yet
                </p>
                <p className="font-editorial-sans text-xs text-[var(--ink-secondary)]">
                  Create your first reading list or anthology to organize this work.
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {collections.map((col) => {
                  const isBusy = updatingId === col.id;

                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => handleToggleItem(col)}
                      disabled={isBusy}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        col.hasPost
                          ? "border-[var(--oxblood)] bg-[var(--oxblood-subtle)] text-[var(--ink-primary)] font-semibold"
                          : "border-[var(--paper-border)] bg-[var(--paper-canvas)] hover:border-[var(--oxblood)]/50 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      <div className="space-y-0.5 max-w-[280px]">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)] truncate">
                            {col.title}
                          </span>
                          {!col.isPublic && (
                            <span title="Private Collection">
                              <Lock className="h-3 w-3 text-[var(--ink-muted)] shrink-0" />
                            </span>
                          )}
                        </div>
                        <span className="font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                          {col.itemCount} {col.itemCount === 1 ? "work" : "works"}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center pl-2">
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[var(--oxblood)]" />
                        ) : col.hasPost ? (
                          <div className="h-5 w-5 rounded-full bg-[var(--oxblood)] text-white flex items-center justify-center shadow-2xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-[var(--paper-border)] hover:border-[var(--oxblood)] transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Inline Creation Form or Create Button */}
            {isCreating ? (
              <form onSubmit={handleCreateCollection} className="space-y-3 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-warm)] p-3.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-editorial-mono text-[10px] uppercase font-bold text-[var(--oxblood)]">
                    New Collection
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-[10px] font-editorial-mono text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  >
                    Cancel
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Collection Title (e.g. Critical Systems)..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                  maxLength={100}
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-2 sm:py-1.5 text-base sm:text-xs font-editorial-sans text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:border-[var(--oxblood)] focus:outline-hidden"
                />

                <input
                  type="text"
                  placeholder="Optional brief description or thematic focus..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={500}
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-2 sm:py-1.5 text-base sm:text-xs font-editorial-sans text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:border-[var(--oxblood)] focus:outline-hidden"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-1.5 text-[11px] font-editorial-sans text-[var(--ink-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsPublic}
                      onChange={(e) => setNewIsPublic(e.target.checked)}
                      className="accent-[var(--oxblood)] rounded"
                    />
                    <span>Public anthology</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingNew || !newTitle.trim()}
                    className="inline-flex min-h-[40px] items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-3 py-1.5 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-2xs hover:bg-[var(--oxblood-hover)] disabled:opacity-40 cursor-pointer"
                  >
                    {isSubmittingNew ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    <span>Create &amp; Add</span>
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full min-h-[44px] flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border border-dashed border-[var(--paper-border)] bg-[var(--paper-warm)] font-editorial-sans text-xs text-[var(--oxblood)] font-bold hover:border-[var(--oxblood)] hover:bg-[var(--paper-surface)] transition-all cursor-pointer"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>Create New Collection</span>
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[var(--editorial-rule)] pt-3 flex items-center justify-between font-editorial-mono text-[10px] text-[var(--ink-muted)]">
          <span>Continuous Reader Ledger</span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-[var(--oxblood)] font-bold uppercase cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

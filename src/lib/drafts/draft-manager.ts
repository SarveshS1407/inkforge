/**
 * INKFORGE — Draft Manager & Local Recovery Buffer
 * Provides local-first draft resilience, offline buffer storage,
 * and safe, idempotent migration from legacy localStorage to backend ledger.
 */

export interface LocalDraftData {
  id?: string;
  title: string;
  excerpt?: string;
  contentHtml: string;
  contentJson?: string | object;
  publication?: string;
  status?: string;
  scheduledFor?: string | null;
  updatedAt: string;
  slug?: string;
  version?: number;
}

export interface RecoveryBufferData {
  documentId: string | null;
  title: string;
  excerpt: string;
  contentHtml: string;
  contentJson: string | object | null;
  status: string;
  publication?: string;
  version: number;
  timestamp: number;
}

const ACTIVE_DRAFT_KEY = "inkforge_active_draft";
const ALL_POSTS_KEY = "inkforge_all_posts";
const RECOVERY_BUFFER_PREFIX = "inkforge_recovery_buffer_";
const MIGRATED_DRAFTS_KEY = "inkforge_migrated_draft_keys";

export class DraftManager {
  private static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  /**
   * Retrieve the active local draft.
   */
  static getActiveDraft(): LocalDraftData | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = localStorage.getItem(ACTIVE_DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error("[DraftManager] Failed to read active draft:", e);
      return null;
    }
  }

  /**
   * Persist the active local draft.
   */
  static setActiveDraft(draft: LocalDraftData): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(ACTIVE_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error("[DraftManager] Failed to persist active draft:", e);
    }
  }

  /**
   * Clear the active local draft after successful server synchronization.
   */
  static clearActiveDraft(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(ACTIVE_DRAFT_KEY);
    } catch (e) {
      console.error("[DraftManager] Failed to clear active draft:", e);
    }
  }

  /**
   * Retrieve list of local posts stored in legacy localStorage.
   */
  static getLocalPosts(): LocalDraftData[] {
    if (!this.isBrowser()) return [];
    try {
      const raw = localStorage.getItem(ALL_POSTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("[DraftManager] Failed to read local posts:", e);
      return [];
    }
  }

  /**
   * Save a post record to the local posts array.
   */
  static saveLocalPost(post: LocalDraftData): void {
    if (!this.isBrowser()) return;
    try {
      const existing = this.getLocalPosts();
      const slug = post.slug || (post.title || "untitled-document")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const index = existing.findIndex((p) => (post.id && p.id === post.id) || p.slug === slug);
      const updatedItem: LocalDraftData = {
        ...post,
        slug,
        id: post.id || `local-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };

      if (index >= 0) {
        existing[index] = updatedItem;
      } else {
        existing.unshift(updatedItem);
      }

      localStorage.setItem(ALL_POSTS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error("[DraftManager] Failed to save local post:", e);
    }
  }

  /**
   * Remove a local post by ID or slug.
   */
  static removeLocalPost(idOrSlug: string): void {
    if (!this.isBrowser()) return;
    try {
      const existing = this.getLocalPosts();
      const filtered = existing.filter((p) => p.id !== idOrSlug && p.slug !== idOrSlug);
      localStorage.setItem(ALL_POSTS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("[DraftManager] Failed to remove local post:", e);
    }
  }

  /**
   * Write to the immediate local recovery buffer.
   * This buffer survives tab crashes, network disconnections, and accidental navigation.
   */
  static saveRecoveryBuffer(
    documentId: string | null,
    data: {
      title: string;
      excerpt?: string;
      contentHtml: string;
      contentJson?: string | object | null;
      status?: string;
      publication?: string;
      version?: number;
    }
  ): void {
    if (!this.isBrowser()) return;
    const key = `${RECOVERY_BUFFER_PREFIX}${documentId || "new"}`;
    const payload: RecoveryBufferData = {
      documentId,
      title: data.title,
      excerpt: data.excerpt || "",
      contentHtml: data.contentHtml,
      contentJson: data.contentJson || null,
      status: data.status || "DRAFT",
      publication: data.publication,
      version: data.version || 1,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn("[DraftManager] Local recovery buffer write failed (storage quota?):", e);
    }
  }

  /**
   * Retrieve the local recovery buffer for a given document.
   */
  static getRecoveryBuffer(documentId: string | null): RecoveryBufferData | null {
    if (!this.isBrowser()) return null;
    const key = `${RECOVERY_BUFFER_PREFIX}${documentId || "new"}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Clear the local recovery buffer once the backend confirms persistence.
   */
  static clearRecoveryBuffer(documentId: string | null): void {
    if (!this.isBrowser()) return;
    const key = `${RECOVERY_BUFFER_PREFIX}${documentId || "new"}`;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignored
    }
  }

  /**
   * Detect unmigrated local drafts that do not exist on the server.
   * Returns list of drafts eligible for server migration.
   */
  static getUnmigratedDrafts(): LocalDraftData[] {
    if (!this.isBrowser()) return [];
    const migratedKeys = this.getMigratedKeys();
    const drafts: LocalDraftData[] = [];

    // Check active draft
    const active = this.getActiveDraft();
    if (active && (active.contentHtml || active.title)) {
      const key = `active_${active.title}_${active.updatedAt}`;
      if (!migratedKeys.has(key)) {
        drafts.push({ ...active, id: active.id || "active-draft" });
      }
    }

    // Check all local posts
    const localPosts = this.getLocalPosts();
    for (const post of localPosts) {
      // Filter out seed/sample posts
      if (post.id?.startsWith("sample-")) continue;
      const key = `post_${post.slug || post.id}`;
      if (!migratedKeys.has(key) && !drafts.some((d) => d.slug === post.slug && d.title === post.title)) {
        drafts.push(post);
      }
    }

    return drafts;
  }

  /**
   * Record that a local draft key has been safely migrated to prevent duplicate creation.
   */
  static markDraftMigrated(key: string): void {
    if (!this.isBrowser()) return;
    try {
      const keys = Array.from(this.getMigratedKeys());
      keys.push(key);
      localStorage.setItem(MIGRATED_DRAFTS_KEY, JSON.stringify(keys));
    } catch {
      // Ignored
    }
  }

  private static getMigratedKeys(): Set<string> {
    if (!this.isBrowser()) return new Set();
    try {
      const raw = localStorage.getItem(MIGRATED_DRAFTS_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }
}

"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Header } from "@/components/navigation/Header";
import { useStudioDocument, SaveStatus } from "@/hooks/useStudioDocument";
import { DraftManager, LocalDraftData } from "@/lib/drafts/draft-manager";
import {
  Save,
  Send,
  Calendar,
  Clock,
  Feather,
  CheckCircle2,
  BookOpen,
  Eye,
  Edit3,
  ArrowRight,
  Maximize2,
  Minimize2,
  HelpCircle,
  FileText,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Plus,
  History,
  Copy,
  Check,
  RotateCcw,
  CloudUpload,
  X,
  Share2,
  Lock,
  Globe,
} from "lucide-react";
import { SafeContentRenderer } from "@/components/content/SafeContentRenderer";

const Editor = dynamic(
  () => import("@/components/editor/Editor").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] text-[var(--ink-muted)] font-editorial-mono text-xs shadow-xs">
        <span className="animate-pulse">Loading Writing Canvas...</span>
      </div>
    ),
  }
);

interface DocumentRevision {
  id: string;
  version: number;
  title: string;
  wordCount: number;
  excerpt: string | null;
  createdAt: string;
  contentJson: string;
}

function WritePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const docIdParam = searchParams.get("id");
  const bookIdParam = searchParams.get("bookId");

  const doc = useStudioDocument({
    initialDocumentId: docIdParam,
    bookId: bookIdParam,
  });

  const [proofMode, setProofMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Revision History State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revisions, setRevisions] = useState<DocumentRevision[]>([]);
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);

  // Local Drafts Migration State
  const [unmigratedDrafts, setUnmigratedDrafts] = useState<LocalDraftData[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationNotice, setMigrationNotice] = useState<string | null>(null);

  // Copied State
  const [copiedConflict, setCopiedConflict] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Publishing Workflow Modal & State
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const handlePublishClick = async () => {
    setIsPublishing(true);
    const result = await doc.publishManuscript();
    setIsPublishing(false);
    if (result.success && result.data) {
      const canonical = result.data.canonicalUrl || `/read/${result.data.slug}`;
      setPublishedUrl(canonical);
      setPublishModalOpen(true);
    }
  };

  const handleUnpublishClick = async () => {
    const confirm = window.confirm(
      "Are you sure you wish to unpublish this manuscript? It will be removed from public feeds and converted back into a private draft."
    );
    if (!confirm) return;
    setIsUnpublishing(true);
    await doc.unpublishManuscript();
    setIsUnpublishing(false);
  };

  // Check unmigrated local drafts on mount
  useEffect(() => {
    if (doc.isAuthenticated) {
      const pending = DraftManager.getUnmigratedDrafts();
      setUnmigratedDrafts(pending);
    }
  }, [doc.isAuthenticated, doc.documentId]);

  // Handle migration of all local drafts
  const handleMigrateLocalDrafts = async () => {
    if (unmigratedDrafts.length === 0 || isMigrating) return;
    setIsMigrating(true);
    let migratedCount = 0;

    try {
      for (const draft of unmigratedDrafts) {
        const title = draft.title || "Untitled Local Draft";
        const res = await fetch("/api/v1/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            excerpt: draft.excerpt || "",
            contentHtml: draft.contentHtml || "",
            status: draft.status || "DRAFT",
          }),
        });

        if (res.ok) {
          const key = draft.id?.startsWith("active")
            ? `active_${draft.title}_${draft.updatedAt}`
            : `post_${draft.slug || draft.id}`;
          DraftManager.markDraftMigrated(key);
          migratedCount++;
        }
      }

      setUnmigratedDrafts([]);
      setMigrationNotice(`Successfully migrated ${migratedCount} local manuscript(s) to your permanent registry!`);
      setTimeout(() => setMigrationNotice(null), 5000);
    } catch (e) {
      console.error("Migration error:", e);
      setMigrationNotice("Encountered an issue migrating local drafts. Some drafts remain preserved locally.");
    } finally {
      setIsMigrating(false);
    }
  };

  // Fetch revisions when history drawer opens
  const handleOpenRevisions = async () => {
    if (!doc.documentId) return;
    setHistoryOpen(true);
    setIsLoadingRevisions(true);
    try {
      const res = await fetch(`/api/v1/documents/${doc.documentId}/revisions`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setRevisions(json.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch revisions:", e);
    } finally {
      setIsLoadingRevisions(false);
    }
  };

  // Start a fresh, clean manuscript
  const handleNewManuscript = () => {
    if (doc.isDirty) {
      const confirmNew = window.confirm(
        "You have unsaved changes in this manuscript. Are you sure you wish to open a new blank leaf?"
      );
      if (!confirmNew) return;
    }
    router.push("/write");
  };

  // Keyboard shortcut Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        doc.manualSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [doc]);

  const calculateRhythm = () => {
    if (doc.words === 0) return "Blank Leaf";
    if (doc.words < 300) return "Epigram / Sketch";
    if (doc.words < 800) return "Critical Essay";
    if (doc.words < 1800) return "Treatise";
    return "Extended Monograph";
  };

  const progressPct = Math.min(100, Math.round((doc.words / doc.targetWords) * 100));

  // Render Save Status Badge
  const renderSaveStatusBadge = () => {
    switch (doc.saveStatus) {
      case "saving":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-editorial-mono uppercase tracking-wider bg-[var(--paper-warm)] border border-[var(--paper-border)] text-[var(--oxblood)] animate-pulse">
            <Loader2 className="h-2.5 w-2.5 animate-spin text-[var(--oxblood)]" />
            <span>Preserving to ledger...</span>
          </span>
        );
      case "conflict":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-editorial-mono uppercase tracking-wider bg-[var(--oxblood)] text-white font-bold animate-bounce shadow-xs">
            <AlertTriangle className="h-2.5 w-2.5 text-white" />
            <span>Version Conflict (409)</span>
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-editorial-mono uppercase tracking-wider bg-[var(--paper-warm)] border border-[var(--oxblood)] text-[var(--oxblood)] font-bold">
            <AlertCircle className="h-2.5 w-2.5 text-[var(--oxblood)]" />
            <span>Save Failed (Local Copy Kept)</span>
          </span>
        );
      case "offline_saved":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-editorial-mono uppercase tracking-wider bg-[var(--paper-warm)] border border-sky-400 text-sky-700 dark:text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            <span>Buffered in Local Sanctuary</span>
          </span>
        );
      case "unsaved":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-editorial-mono uppercase tracking-wider bg-[var(--paper-warm)] border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Unsaved Changes</span>
          </span>
        );
      case "saved":
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-editorial-mono uppercase tracking-wider bg-[var(--paper-warm)] border border-[var(--paper-border)] text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {doc.status === "PUBLISHED"
                ? "Published · Saved"
                : doc.lastSavedAt
                ? `Archived (${doc.lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })})`
                : "Saved to Archive"}
            </span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      {/* Global Header (Hidden during solitary Focus Mode) */}
      {!focusMode && <Header />}

      {/* Floating Focus Mode Bar */}
      {focusMode && (
        <aside
          aria-label="Focus Mode Bar"
          className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--editorial-rule)] bg-[var(--paper-canvas)]/95 px-6 py-2.5 backdrop-blur-md"
        >
          <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--oxblood)] animate-pulse" />
            <span className="font-bold text-[var(--oxblood)]">Solitary Focus Mode</span>
            <span>•</span>
            <span>{doc.words.toLocaleString()} words</span>
          </div>

          <div className="flex items-center space-x-3">
            {renderSaveStatusBadge()}
            <button
              type="button"
              onClick={() => doc.manualSave()}
              className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-1 text-xs font-editorial-sans text-[var(--ink-primary)] hover:border-[var(--oxblood)]"
            >
              <Save className="h-3 w-3 text-[var(--oxblood)]" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--paper-warm)] border border-[var(--paper-border)] px-3 py-1 font-editorial-sans text-xs text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors"
            >
              <Minimize2 className="h-3 w-3" />
              <span>Exit Focus Mode</span>
            </button>
          </div>
        </aside>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Version Conflict Modal / Alert */}
        {doc.conflictData && (
          <div className="mb-8 rounded-xl border border-[var(--oxblood)] bg-[var(--oxblood-subtle)] p-6 shadow-md animate-in fade-in">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-[var(--oxblood)] shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                  Version Divergence Detected (Conflict 409)
                </h3>
                <p className="font-editorial-sans text-xs text-[var(--ink-secondary)] leading-relaxed">
                  A newer revision of this manuscript (Server Version {doc.conflictData.serverVersion}) was saved from another browser tab or device. Your local prose is safely preserved in this editor and in your local sanctuary buffer.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={doc.resolveConflictKeepMine}
                    className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-3.5 py-1.5 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Keep My Changes (Overwrite)</span>
                  </button>

                  <button
                    type="button"
                    onClick={doc.resolveConflictLoadServer}
                    className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3.5 py-1.5 text-xs font-editorial-sans font-medium text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Load Server Version</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined") {
                        navigator.clipboard.writeText(doc.contentHtml);
                        setCopiedConflict(true);
                        setTimeout(() => setCopiedConflict(false), 2000);
                      }
                    }}
                    className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3.5 py-1.5 text-xs font-editorial-sans text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-all cursor-pointer"
                  >
                    {copiedConflict ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedConflict ? "Copied Local Text!" : "Copy Local Prose"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Local Drafts Migration Banner */}
        {unmigratedDrafts.length > 0 && !doc.conflictData && (
          <div className="mb-6 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-warm)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-3">
              <CloudUpload className="h-5 w-5 text-[var(--oxblood)] shrink-0" />
              <div>
                <h4 className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)]">
                  {unmigratedDrafts.length} Local Draft(s) Detected in this Browser
                </h4>
                <p className="font-editorial-sans text-xs text-[var(--ink-secondary)]">
                  Would you like to sync your legacy local drafts into your permanent authenticated author ledger?
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleMigrateLocalDrafts}
                disabled={isMigrating}
                className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-3 py-1.5 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isMigrating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CloudUpload className="h-3 w-3" />}
                <span>{isMigrating ? "Syncing..." : "Sync to Ledger"}</span>
              </button>
              <button
                type="button"
                onClick={() => setUnmigratedDrafts([])}
                className="rounded-md p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                title="Dismiss notice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Migration Success Notice */}
        {migrationNotice && (
          <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{migrationNotice}</span>
          </div>
        )}

        {/* Active Book Identity Banner if present */}
        {doc.activeBook && !focusMode && (
          <div className="mb-6 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-warm)] p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-4 w-4 text-[var(--oxblood)]" />
              <div>
                <span className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                  Active Volume Manuscript • {doc.activeBook.genre}
                </span>
                <h4 className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)]">
                  {doc.activeBook.title}{" "}
                  <span className="font-normal italic text-xs text-[var(--ink-secondary)]">
                    by {doc.activeBook.author}
                  </span>
                </h4>
              </div>
            </div>
            <Link
              href={`/books/${doc.activeBook.id}`}
              className="inline-flex items-center space-x-1 font-editorial-mono text-[10px] uppercase text-[var(--oxblood)] hover:underline font-bold"
            >
              <span>Book Workspace</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* 3-REGION STUDIO HEADER */}
        {!focusMode && (
          <header className="mb-8 border-b border-[var(--editorial-rule)] pb-6 space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* REGION A: DOCUMENT INFORMATION */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2 font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
                  <span className="font-bold text-[var(--oxblood)]">Writing Studio</span>
                  <span>•</span>
                  <span>
                    {doc.documentId
                      ? `Ledger ID: ${doc.documentId.substring(0, 8)}... (v${doc.version})`
                      : "Unbound Leaf (New)"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[var(--ink-primary)] tracking-tight truncate max-w-sm sm:max-w-md">
                    {doc.title || "Untitled Manuscript"}
                  </h1>

                  {/* Live Save Status Badge */}
                  {renderSaveStatusBadge()}
                </div>
              </div>

              {/* REGION C: ACTIONS */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Action: New Manuscript */}
                <button
                  type="button"
                  onClick={handleNewManuscript}
                  className="h-9 inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 text-xs font-editorial-sans text-[var(--ink-secondary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] transition-colors shadow-2xs cursor-pointer"
                  title="Begin a fresh manuscript"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">New Piece</span>
                </button>

                {/* Action: My Drafts / Catalogue */}
                <Link
                  href="/posts"
                  className="h-9 inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 text-xs font-editorial-sans text-[var(--ink-secondary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] transition-colors shadow-2xs"
                  title="View all drafts and published articles in the ledger"
                >
                  <FileText className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                  <span className="hidden sm:inline">Ledger</span>
                </Link>

                {/* Action: Revisions Drawer Toggle */}
                {doc.documentId && doc.isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleOpenRevisions}
                    className="h-9 inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 text-xs font-editorial-sans text-[var(--ink-secondary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] transition-colors shadow-2xs cursor-pointer"
                    title="View revision snapshots"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Revisions</span>
                  </button>
                )}

                {/* Lifecycle Status Selector */}
                <select
                  value={doc.status}
                  onChange={(e) =>
                    doc.handleStatusChange(
                      e.target.value as "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED"
                    )
                  }
                  className="h-9 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 text-xs font-editorial-sans text-[var(--ink-primary)] shadow-2xs focus:border-[var(--oxblood)] focus:outline-hidden"
                  title="Document publication lifecycle state"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="IN_REVIEW">Editorial Review</option>
                  <option value="SCHEDULED">Schedule Edition</option>
                  <option value="PUBLISHED">Published</option>
                </select>

                {/* Scheduled DateTime picker if applicable */}
                {doc.status === "SCHEDULED" && (
                  <div className="h-9 flex items-center space-x-1 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2 text-xs shadow-2xs">
                    <Calendar className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                    <input
                      type="datetime-local"
                      value={doc.scheduledDate}
                      onChange={(e) => doc.setScheduledDate(e.target.value)}
                      className="bg-transparent text-xs text-[var(--ink-primary)] focus:outline-hidden font-editorial-mono"
                    />
                  </div>
                )}

                {/* Focus Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setFocusMode(true)}
                  className="h-9 inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 text-xs font-editorial-sans text-[var(--ink-secondary)] hover:border-[var(--oxblood)] hover:text-[var(--ink-primary)] transition-colors shadow-2xs"
                  title="Enter distraction-free Focus Mode"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Focus</span>
                </button>

                {/* Preview Toggle */}
                <button
                  type="button"
                  onClick={() => setProofMode(!proofMode)}
                  className={`h-9 inline-flex items-center space-x-1.5 rounded-md px-3 text-xs font-editorial-sans border transition-colors shadow-2xs ${
                    proofMode
                      ? "bg-[var(--oxblood)] text-white border-[var(--oxblood)] font-semibold"
                      : "border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:border-[var(--oxblood)]"
                  }`}
                  title="Toggle Reader Preview"
                >
                  {proofMode ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-[var(--ink-muted)]" />}
                  <span>{proofMode ? "Editor" : "Preview"}</span>
                </button>

                {/* Primary: Manual Save */}
                <button
                  type="button"
                  onClick={() => doc.manualSave()}
                  disabled={doc.saveStatus === "saving"}
                  className="h-9 inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 text-xs font-editorial-sans font-medium text-[var(--ink-primary)] hover:border-[var(--oxblood)] hover:text-[var(--oxblood)] shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
                  title="Save Manuscript (Cmd+S)"
                >
                  <Save className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                  <span>{doc.saveStatus === "saving" ? "Saving..." : "Save"}</span>
                </button>

                {/* Publish & Publication Actions */}
                {doc.status === "PUBLISHED" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const slug = doc.title ? doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : doc.documentId;
                        setPublishedUrl(`/read/${slug}`);
                        setPublishModalOpen(true);
                      }}
                      className="h-9 inline-flex items-center space-x-1.5 rounded-md border border-[var(--oxblood)] bg-[var(--oxblood-subtle)] px-3 text-xs font-editorial-sans font-semibold text-[var(--oxblood)] hover:bg-[var(--oxblood)] hover:text-white shadow-2xs transition-all cursor-pointer"
                      title="Share published public link"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share Folio</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleUnpublishClick}
                      disabled={isUnpublishing}
                      className="h-9 inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 text-xs font-editorial-sans text-[var(--ink-secondary)] hover:text-[var(--oxblood)] hover:border-[var(--oxblood)] shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
                      title="Convert back to private draft"
                    >
                      {isUnpublishing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      <span>{isUnpublishing ? "Unpublishing..." : "Unpublish"}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublishClick}
                    disabled={isPublishing || doc.saveStatus === "saving"}
                    className="h-9 inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-2xs hover:bg-[var(--oxblood-hover)] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
                    title="Publish manuscript to public reader archive"
                  >
                    {isPublishing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>{isPublishing ? "Publishing..." : "Publish"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* REGION B: STATISTICS */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3.5 py-1.5 font-editorial-mono text-xs text-[var(--ink-muted)] shadow-2xs">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-[var(--ink-primary)]">{doc.words.toLocaleString()}</span>
                  <span>/</span>
                  <button
                    type="button"
                    onClick={() => {
                      const options = [500, 800, 1200, 2000, 3000];
                      const next = options[(options.indexOf(doc.targetWords) + 1) % options.length] || 1200;
                      doc.setTargetWords(next);
                    }}
                    className="font-bold text-[var(--oxblood)] hover:underline"
                    title="Click to cycle word goal (500, 800, 1200, 2000, 3000)"
                  >
                    {doc.targetWords.toLocaleString()} words
                  </button>
                </div>

                <span>•</span>

                <div className="relative group cursor-help flex items-center space-x-1">
                  <span>~{(doc.words / 280).toFixed(1)} pages</span>
                  <HelpCircle className="h-3 w-3 opacity-50" />
                  <div className="hidden group-hover:block absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2 py-1 text-[10px] text-[var(--ink-secondary)] shadow-md whitespace-nowrap">
                    Estimated at standard ~250–300 words per book page
                  </div>
                </div>

                <span>•</span>

                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 opacity-60" />
                  <span>{Math.max(1, Math.ceil(doc.words / 220))} min read</span>
                </div>

                <span>•</span>

                <span className="font-semibold uppercase text-[10px] text-[var(--oxblood)]">
                  {calculateRhythm()}
                </span>

                <div className="w-16 h-1.5 rounded-full bg-[var(--paper-warm)] border border-[var(--paper-border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--oxblood)] transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] font-editorial-mono text-[var(--ink-muted)] hidden sm:block">
                Press <kbd className="px-1.5 py-0.5 rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] text-[10px]">Cmd+S</kbd> to save anytime
              </div>
            </div>
          </header>
        )}

        {/* Error Alert Banner */}
        {doc.errorMessage && !doc.conflictData && (
          <div className="mb-6 rounded-lg border border-[var(--oxblood)]/40 bg-[var(--paper-warm)] p-3 text-xs text-[var(--oxblood)] font-editorial-sans flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{doc.errorMessage}</span>
          </div>
        )}

        {/* MANUSCRIPT TITLE & EXCERPT */}
        <div className="mb-8 space-y-3">
          <input
            type="text"
            placeholder="Inscribe Title..."
            value={doc.title}
            onChange={(e) => doc.handleTitleChange(e.target.value)}
            className="w-full bg-transparent font-editorial-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/40 focus:outline-hidden"
          />

          <input
            type="text"
            placeholder="Add a subtitle, epigraph, or short synopsis..."
            value={doc.excerpt}
            onChange={(e) => doc.handleExcerptChange(e.target.value)}
            className="w-full bg-transparent font-editorial-serif italic text-lg sm:text-xl text-[var(--ink-secondary)] placeholder-[var(--ink-muted)]/40 focus:outline-hidden"
          />
        </div>

        {/* PREVIEW MODE vs LIVE WRITING CANVAS */}
        {proofMode ? (
          <div className="book-jacket rounded-xl p-8 sm:p-12 mb-12 shadow-xs border border-[var(--oxblood)]/30 relative">
            <div className="mb-4 flex items-center justify-between font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] pb-3 border-b border-[var(--editorial-rule)]">
              <div className="flex items-center space-x-2 font-bold">
                <span className="h-2 w-2 rounded-full bg-[var(--oxblood)] animate-pulse" />
                <span>PRIVATE READER PREVIEW INSPECTION</span>
              </div>
              <button
                type="button"
                onClick={() => setProofMode(false)}
                className="text-xs hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Edit3 className="h-3 w-3" />
                <span>Return to Editor</span>
              </button>
            </div>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-[var(--ink-primary)]">
              {doc.title || "Untitled Document"}
            </h2>
            {doc.excerpt && (
              <p className="mt-3 font-editorial-serif text-lg italic text-[var(--ink-secondary)]">
                {doc.excerpt}
              </p>
            )}
            <div className="mt-8">
              <SafeContentRenderer
                contentJson={doc.contentJson}
                contentHtml={doc.contentHtml}
              />
            </div>
          </div>
        ) : (
          <div className="mb-12">
            <Editor
              initialContent={doc.contentHtml}
              documentKey={doc.documentId || "new"}
              onChange={doc.handleEditorChange}
            />
          </div>
        )}

        {/* Editorial Craftsmanship Guidance */}
        {!focusMode && (
          <div className="book-jacket rounded-xl p-6 sm:p-8">
            <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] mb-2 font-bold">
              <Feather className="h-3.5 w-3.5" />
              <span>Editorial Composition Precepts</span>
            </div>
            <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] leading-relaxed">
              Every sentence inscribed in INKFORGE is preserved with automatic debounced autosave. When published, your manuscript adapts into long-form digital folios, ambient reading modes, and print-ready editions. Write with permanence.
            </p>
          </div>
        )}
      </main>

      {/* PUBLICATION SUCCESS & SHARING MODAL */}
      {publishModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPublishModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3">
              <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Manuscript Published to Ledger</span>
              </div>
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="rounded-md p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                &ldquo;{doc.title}&rdquo; is now public.
              </h3>
              <p className="font-editorial-serif italic text-sm text-[var(--ink-secondary)] leading-relaxed">
                Your monograph is officially preserved and live in the public reader index. Readers can explore your thoughts through classical editorial typography.
              </p>

              <div className="p-3.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-warm)] space-y-1.5">
                <div className="font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                  Canonical Public URL
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    readOnly
                    type="text"
                    value={
                      typeof window !== "undefined"
                        ? `${window.location.origin}${publishedUrl || `/read/${doc.documentId}`}`
                        : publishedUrl || ""
                    }
                    className="w-full bg-[var(--paper-surface)] px-2.5 py-1.5 rounded border border-[var(--paper-border)] font-editorial-mono text-xs text-[var(--ink-primary)] select-all focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url =
                        typeof window !== "undefined"
                          ? `${window.location.origin}${publishedUrl || `/read/${doc.documentId}`}`
                          : publishedUrl || "";
                      navigator.clipboard.writeText(url);
                      setCopiedShare(true);
                      setTimeout(() => setCopiedShare(false), 2000);
                    }}
                    className="shrink-0 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[var(--oxblood)] text-white text-xs font-editorial-mono font-bold hover:bg-[var(--oxblood-hover)] transition-colors cursor-pointer"
                  >
                    {copiedShare ? (
                      <Check className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedShare ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--editorial-rule)]">
              <Link
                href={publishedUrl || `/read/${doc.documentId}`}
                target="_blank"
                className="inline-flex items-center space-x-1.5 font-editorial-sans text-xs font-semibold text-[var(--oxblood)] hover:underline"
              >
                <span>Open Reader Edition</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="px-4 py-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] text-xs font-editorial-sans text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors cursor-pointer"
              >
                Continue Inscribing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVISION HISTORY MODAL */}
      {historyOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-3">
              <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold">
                <History className="h-4 w-4" />
                <span>Revision Ledger</span>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-md p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {isLoadingRevisions ? (
                <div className="py-8 text-center font-editorial-mono text-xs text-[var(--ink-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2 text-[var(--oxblood)]" />
                  <span>Loading archival revisions...</span>
                </div>
              ) : revisions.length === 0 ? (
                <div className="py-8 text-center font-editorial-serif italic text-sm text-[var(--ink-secondary)]">
                  No snapshot revisions yet recorded for this document. Revisions are created automatically when significant content updates are saved.
                </div>
              ) : (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-warm)] space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-editorial-mono text-[10px]">
                      <span className="font-bold text-[var(--oxblood)]">Version {rev.version}</span>
                      <span className="text-[var(--ink-muted)]">
                        {new Date(rev.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-editorial-serif text-sm font-semibold text-[var(--ink-primary)]">
                      {rev.title}
                    </div>
                    <div className="font-editorial-mono text-[11px] text-[var(--ink-muted)] flex items-center space-x-3">
                      <span>{rev.wordCount} words</span>
                      {rev.excerpt && <span>• &ldquo;{rev.excerpt.slice(0, 45)}...&rdquo;</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[var(--editorial-rule)] text-center font-editorial-mono text-[10px] text-[var(--ink-muted)]">
              All revisions are permanently recorded in the cryptographic ledger.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--paper-canvas)] flex items-center justify-center">
          <div className="font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] animate-pulse">
            Loading Manuscript Studio...
          </div>
        </div>
      }
    >
      <WritePageContent />
    </Suspense>
  );
}

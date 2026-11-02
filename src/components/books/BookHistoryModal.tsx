"use client";

import { useState, useEffect } from "react";
import { X, History, RotateCcw, Clock, CheckCircle2, AlertCircle, Loader2, GitCommit, FileText } from "lucide-react";

interface BookHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  onRestored?: () => void;
}

export function BookHistoryModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  onRestored,
}: BookHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "REVISIONS">("TIMELINE");
  const [activities, setActivities] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !bookId) return;

    let isMounted = true;
    async function loadHistory() {
      setIsLoading(true);
      setErrorMessage(null);
      setStatusMessage(null);

      try {
        const res = await fetch(`/api/v1/books/${bookId}/history`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to load history.");
        }

        if (isMounted) {
          setActivities(json.data?.activities || []);
          setRevisions(json.data?.revisions || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load history.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [isOpen, bookId]);

  if (!isOpen) return null;

  const handleRestore = async (version: number) => {
    const confirmed = window.confirm(
      `Are you sure you wish to restore "${bookTitle}" to Version ${version}? Current draft chapters will be replaced with this archived snapshot.`
    );
    if (!confirmed) return;

    setRestoringVersion(version);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/books/${bookId}/restore-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to restore revision.");
      }

      setStatusMessage(`Successfully restored manuscript to Version ${version}!`);
      if (onRestored) onRestored();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Restore failed.");
    } finally {
      setRestoringVersion(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[90dvh] flex flex-col rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] px-6 py-4 bg-[var(--paper-warm)]/70">
          <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] font-bold">
            <History className="h-4 w-4" />
            <span>Archive History &amp; Revision Snapshots</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-border)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--editorial-rule)] bg-[var(--paper-canvas)] px-6 text-xs font-editorial-mono">
          <button
            type="button"
            onClick={() => setActiveTab("TIMELINE")}
            className={`py-3 px-3 border-b-2 font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "TIMELINE"
                ? "border-[var(--oxblood)] text-[var(--oxblood)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Activity Timeline ({activities.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("REVISIONS")}
            className={`py-3 px-3 border-b-2 font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "REVISIONS"
                ? "border-[var(--oxblood)] text-[var(--oxblood)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <GitCommit className="h-3.5 w-3.5" />
            <span>Version Snapshots ({revisions.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {statusMessage && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-start space-x-2 text-xs text-emerald-800 dark:text-emerald-300 font-editorial-sans">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg bg-[var(--paper-warm)] border border-[var(--oxblood)]/40 p-3 flex items-start space-x-2 text-xs text-[var(--oxblood)] font-editorial-sans">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center space-y-2 text-[var(--ink-muted)]">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--oxblood)]" />
              <p className="font-editorial-mono text-xs uppercase tracking-wider">
                Retrieving archival records...
              </p>
            </div>
          ) : activeTab === "TIMELINE" ? (
            activities.length === 0 ? (
              <p className="py-8 text-center font-editorial-serif italic text-xs text-[var(--ink-muted)]">
                No recorded activity found for this book yet.
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-canvas)] space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-editorial-mono text-[10px]">
                      <span className="font-bold text-[var(--oxblood)] tracking-wider uppercase px-2 py-0.5 rounded bg-[var(--paper-warm)] border border-[var(--paper-border)]">
                        {act.action}
                      </span>
                      <span className="text-[var(--ink-muted)]">
                        {new Date(act.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="font-editorial-sans text-xs text-[var(--ink-primary)] leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : revisions.length === 0 ? (
            <p className="py-8 text-center font-editorial-serif italic text-xs text-[var(--ink-muted)]">
              No version snapshots recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-canvas)] flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-editorial-mono text-xs font-bold text-[var(--oxblood)]">
                        Version {rev.version}
                      </span>
                      <span className="font-editorial-mono text-[9px] uppercase px-2 py-0.5 rounded bg-[var(--paper-warm)] text-[var(--ink-muted)] border border-[var(--paper-border)]">
                        {rev.visibility}
                      </span>
                    </div>
                    <p className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)] truncate">
                      {rev.title}
                    </p>
                    <p className="font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                      {rev.chapterCount} chapters • {rev.wordCount.toLocaleString()} words •{" "}
                      {new Date(rev.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestore(rev.version)}
                    disabled={restoringVersion !== null}
                    className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] hover:border-[var(--oxblood)] bg-[var(--paper-surface)] px-3 py-1.5 font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-primary)] hover:text-[var(--oxblood)] transition-all cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
                  >
                    {restoringVersion === rev.version ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                    <span>Restore</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

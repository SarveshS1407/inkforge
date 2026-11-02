"use client";

import { useState } from "react";
import { X, Check, BookOpen, Layers, Edit2, Trash2, Plus, AlertTriangle, ArrowRight, Shield, Globe } from "lucide-react";
import { DetectedChapter, ParseResult } from "@/lib/services/import.service";

interface ChapterReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  parseResult: ParseResult;
  onConfirm: (finalData: {
    title: string;
    description?: string;
    visibility: "PRIVATE" | "PUBLIC";
    coverTheme: string;
    chapters: Array<{
      title: string;
      contentHtml: string;
      orderIndex: number;
    }>;
  }) => Promise<void>;
  isCreating: boolean;
}

export function ChapterReviewModal({
  isOpen,
  onClose,
  parseResult,
  onConfirm,
  isCreating,
}: ChapterReviewModalProps) {
  const [title, setTitle] = useState(parseResult.detectedTitle);
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [coverTheme, setCoverTheme] = useState("obsidian");
  const [chapters, setChapters] = useState<DetectedChapter[]>(parseResult.chapters);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  if (!isOpen) return null;

  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditTitle(chapters[index].title);
  };

  const handleSaveEdit = (index: number) => {
    if (!editTitle.trim()) return;
    const next = [...chapters];
    next[index] = { ...next[index], title: editTitle.trim() };
    setChapters(next);
    setEditingIndex(null);
  };

  const handleDeleteChapter = (index: number) => {
    if (chapters.length <= 1) return;
    const next = chapters.filter((_, i) => i !== index).map((ch, i) => ({ ...ch, orderIndex: i + 1 }));
    setChapters(next);
  };

  const handleAddEmptyChapter = () => {
    const nextIndex = chapters.length + 1;
    setChapters([
      ...chapters,
      {
        id: `ch-custom-${Date.now()}`,
        title: `Chapter ${nextIndex}`,
        orderIndex: nextIndex,
        wordCount: 0,
        contentHtml: "<p></p>",
        excerpt: "Blank chapter canvas.",
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onConfirm({
      title: title.trim(),
      description: description.trim() || undefined,
      visibility,
      coverTheme,
      chapters: chapters.map((ch, idx) => ({
        title: ch.title,
        contentHtml: ch.contentHtml,
        orderIndex: idx + 1,
      })),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] px-6 py-4 bg-[var(--paper-warm)]/70">
          <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] font-bold">
            <Layers className="h-4 w-4" />
            <span>Manuscript Review &amp; Folio Calibration</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-border)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Warnings Banner if any */}
          {parseResult.warnings && parseResult.warnings.length > 0 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-1 text-xs text-amber-800 dark:text-amber-300 font-editorial-sans">
              <div className="flex items-center space-x-2 font-bold font-editorial-mono uppercase text-[10px] tracking-wider">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Parser Heuristic Notice</span>
              </div>
              {parseResult.warnings.map((w, i) => (
                <p key={i}>• {w}</p>
              ))}
            </div>
          )}

          {/* Book Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold mb-1">
                Book Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 font-editorial-serif text-lg font-bold text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-bold mb-1">
                Synopsis / Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief archival synopsis of this literary work..."
                className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-1.5 font-editorial-sans text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Metrics Pill Row */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg border border-[var(--editorial-rule)] bg-[var(--paper-warm)]/40 text-center font-editorial-mono">
            <div>
              <div className="text-[10px] uppercase text-[var(--ink-muted)] tracking-wider">Chapters</div>
              <div className="text-base font-bold text-[var(--oxblood)]">{chapters.length}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[var(--ink-muted)] tracking-wider">Total Words</div>
              <div className="text-base font-bold text-[var(--ink-primary)]">{totalWords.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[var(--ink-muted)] tracking-wider">Import Method</div>
              <div className="text-xs font-bold text-[var(--amber-gold)] mt-0.5">{parseResult.importMethod}</div>
            </div>
          </div>

          {/* Visibility & Cover Theme Row */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Visibility Option */}
            <div className="space-y-1.5">
              <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold">
                Initial Visibility
              </label>
              <div className="grid grid-cols-2 gap-2 font-editorial-sans text-xs">
                <button
                  type="button"
                  onClick={() => setVisibility("PRIVATE")}
                  className={`p-2.5 rounded-md border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                    visibility === "PRIVATE"
                      ? "border-[var(--oxblood)] bg-[var(--paper-warm)] text-[var(--ink-primary)] font-semibold shadow-2xs"
                      : "border-[var(--paper-border)] hover:border-[var(--oxblood)]/40 text-[var(--ink-secondary)]"
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Shield className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                    <span>Private (Only Me)</span>
                  </div>
                  <span className="font-editorial-mono text-[9px] text-[var(--ink-muted)] mt-1">
                    Hidden from reader &amp; discover
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("PUBLIC")}
                  className={`p-2.5 rounded-md border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                    visibility === "PUBLIC"
                      ? "border-[var(--oxblood)] bg-[var(--paper-warm)] text-[var(--ink-primary)] font-semibold shadow-2xs"
                      : "border-[var(--paper-border)] hover:border-[var(--oxblood)]/40 text-[var(--ink-secondary)]"
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Published (Public)</span>
                  </div>
                  <span className="font-editorial-mono text-[9px] text-[var(--ink-muted)] mt-1">
                    Visible in reader &amp; profile
                  </span>
                </button>
              </div>
            </div>

            {/* Book Cover Theme */}
            <div className="space-y-1.5">
              <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold">
                Cover Binding Theme
              </label>
              <select
                value={coverTheme}
                onChange={(e) => setCoverTheme(e.target.value)}
                className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 font-editorial-mono text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden cursor-pointer"
              >
                <option value="obsidian">Obsidian Black (Classic Leather)</option>
                <option value="vellum">Vellum Ivory (Warm Papercraft)</option>
                <option value="crimson">Crimson Cloth (Guild Edition)</option>
                <option value="emerald">Emerald Morocco (Rare Archive)</option>
                <option value="linen">Linen Natural (Editorial Press)</option>
              </select>
            </div>
          </div>

          {/* Chapters Segmentation List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-2">
              <span className="font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold">
                Detected Chapters ({chapters.length})
              </span>
              <button
                type="button"
                onClick={handleAddEmptyChapter}
                className="inline-flex items-center space-x-1 font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] hover:underline cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="divide-y divide-[var(--editorial-rule)] border border-[var(--editorial-rule)] rounded-lg overflow-hidden bg-[var(--paper-canvas)]">
              {chapters.map((ch, idx) => (
                <div key={ch.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="font-editorial-mono text-[10px] font-bold text-[var(--oxblood)] w-6 shrink-0">
                      #{idx + 1}
                    </span>

                    {editingIndex === idx ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(idx)}
                          className="flex-1 rounded border border-[var(--oxblood)] bg-[var(--paper-surface)] px-2 py-1 text-xs"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(idx)}
                          className="p-1 text-emerald-600 hover:bg-emerald-500/10 rounded cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="font-editorial-serif font-bold text-[var(--ink-primary)] truncate">
                          {ch.title}
                        </p>
                        <p className="font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                          {ch.wordCount.toLocaleString()} words • {ch.excerpt.slice(0, 50)}...
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {editingIndex !== idx && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(idx)}
                        aria-label="Rename chapter"
                        className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] rounded cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                    {chapters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteChapter(idx)}
                        aria-label="Remove chapter"
                        className="p-1 text-[var(--ink-muted)] hover:text-[var(--oxblood)] rounded cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[var(--editorial-rule)] px-6 py-4 bg-[var(--paper-warm)]/70">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="rounded-md border border-[var(--paper-border)] px-4 py-2 font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isCreating || !title.trim()}
            className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-5 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{isCreating ? "Inscribing Folios..." : "Confirm & Inscribe Book"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

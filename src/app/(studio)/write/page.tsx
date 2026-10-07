"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/navigation/Header";
import { Editor } from "@/components/editor/Editor";
import { Save, Send, Calendar, Clock, Feather, CheckCircle2, BookOpen } from "lucide-react";

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [publication, setPublication] = useState("Architecture & Craft");
  const [status, setStatus] = useState<"DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED">("DRAFT");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem("inkforge_active_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.excerpt) setExcerpt(parsed.excerpt);
        if (parsed.contentHtml) setContentHtml(parsed.contentHtml);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.publication) setPublication(parsed.publication);
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
  }, []);

  const handleSave = async (targetStatus = status) => {
    setIsSaving(true);
    const draftData = {
      title: title || "Untitled Manuscript",
      excerpt,
      contentHtml,
      publication,
      status: targetStatus,
      scheduledFor: targetStatus === "SCHEDULED" ? scheduledDate : null,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("inkforge_active_draft", JSON.stringify(draftData));

    try {
      const existingRaw = localStorage.getItem("inkforge_all_posts") || "[]";
      const existing = JSON.parse(existingRaw);
      const postSlug = (title || "untitled-manuscript")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const index = existing.findIndex((p: { slug: string }) => p.slug === postSlug);
      const postRecord = {
        id: `post-${Date.now()}`,
        ...draftData,
        slug: postSlug,
        author: {
          name: "Resident Author",
          role: "Editorial Fellow",
        },
      };

      if (index >= 0) {
        existing[index] = postRecord;
      } else {
        existing.unshift(postRecord);
      }

      localStorage.setItem("inkforge_all_posts", JSON.stringify(existing));
    } catch (err) {
      console.error("Persistence error", err);
    }

    setTimeout(() => {
      setIsSaving(false);
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2500);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[var(--paper-bg)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Scribe Desk Header */}
        <div className="mb-8 flex flex-col gap-4 border-b border-[var(--editorial-rule)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-editorial-mono text-xs font-bold uppercase tracking-widest text-[var(--oxblood)]">
                The Scribe&apos;s Desk
              </span>
              <span className="text-[var(--editorial-rule)]">•</span>
              <span className="font-editorial-mono text-[11px] text-[var(--ink-muted)]">
                Folio IF-MANUSCRIPT
              </span>
            </div>
            <p className="mt-1 font-editorial-serif italic text-sm text-[var(--ink-secondary)]">
              Crafting for long-horizon publication
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Publication Selector */}
            <select
              value={publication}
              onChange={(e) => setPublication(e.target.value)}
              className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1.5 font-editorial-sans text-xs text-[var(--ink-primary)] shadow-xs focus:border-[var(--oxblood)] focus:outline-none"
            >
              <option value="Architecture & Craft">Architecture &amp; Craft</option>
              <option value="Digital Ecology">Digital Ecology</option>
              <option value="Inkforge Engineering">Inkforge Engineering</option>
              <option value="Literary Review">The Literary Review</option>
            </select>

            {/* Lifecycle Status Selector */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1.5 font-editorial-sans text-xs text-[var(--ink-primary)] shadow-xs focus:border-[var(--oxblood)] focus:outline-none"
            >
              <option value="DRAFT">Draft Manuscript</option>
              <option value="IN_REVIEW">Submit for Peer Review</option>
              <option value="SCHEDULED">Schedule Edition</option>
              <option value="PUBLISHED">Published Edition</option>
            </select>

            {status === "SCHEDULED" && (
              <div className="flex items-center space-x-1 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2 py-1 text-xs shadow-xs">
                <Calendar className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-transparent text-xs text-[var(--ink-primary)] focus:outline-none font-editorial-mono"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => handleSave(status)}
              disabled={isSaving}
              className="flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 py-1.5 font-editorial-sans text-xs font-medium text-[var(--ink-primary)] shadow-xs transition-colors hover:border-[var(--oxblood)] disabled:opacity-50 active:scale-[0.98]"
            >
              <Save className="h-3.5 w-3.5 text-[var(--oxblood)]" />
              <span>{isSaving ? "Inking..." : "Save Manuscript"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatus("PUBLISHED");
                handleSave("PUBLISHED");
              }}
              className="flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-1.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-sm active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Publish Edition</span>
            </button>
          </div>
        </div>

        {savedNotification && (
          <div className="mb-6 flex items-center space-x-2 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-card)] px-4 py-2.5 text-xs text-[var(--oxblood)] animate-in fade-in shadow-xs">
            <CheckCircle2 className="h-4 w-4 text-[var(--oxblood)]" />
            <span className="font-editorial-mono">Manuscript faithfully inscribed to the local archive.</span>
          </div>
        )}

        {/* Title & Subtitle */}
        <div className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="Title of this Monograph..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent font-editorial-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/50 focus:outline-none"
          />

          <input
            type="text"
            placeholder="Add an italicized prologue, subtitle, or summary excerpt..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full bg-transparent font-editorial-serif italic text-lg sm:text-xl text-[var(--ink-secondary)] placeholder-[var(--ink-muted)]/40 focus:outline-none"
          />
        </div>

        {/* The Living Editor Canvas */}
        <div className="mb-12">
          <Editor
            initialContent={contentHtml}
            onChange={({ html }) => setContentHtml(html)}
          />
        </div>

        {/* Editorial Guidance Monograph */}
        <div className="paper-sheet rounded-xl p-6 font-editorial-serif text-sm">
          <div className="flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] mb-2 font-bold">
            <Feather className="h-3.5 w-3.5" />
            <span>Editorial Precepts for Inkforge Authors</span>
          </div>
          <p className="text-xs italic text-[var(--ink-secondary)] leading-relaxed">
            Write with enduring intent. Every document in Inkforge is structured as a tree of semantic blocks, allowing seamless conversion between web monographs, print folios, and long-horizon archival editions.
          </p>
        </div>
      </main>
    </div>
  );
}

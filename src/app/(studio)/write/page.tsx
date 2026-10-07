"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/navigation/Header";
import { Editor } from "@/components/editor/Editor";
import { Save, Send, Calendar, Clock, Sparkles, CheckCircle2 } from "lucide-react";

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED">("DRAFT");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("inkforge_active_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.excerpt) setExcerpt(parsed.excerpt);
        if (parsed.contentHtml) setContentHtml(parsed.contentHtml);
        if (parsed.status) setStatus(parsed.status);
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
  }, []);

  const handleSave = async (targetStatus = status) => {
    setIsSaving(true);
    const draftData = {
      title: title || "Untitled Story",
      excerpt,
      contentHtml,
      status: targetStatus,
      scheduledFor: targetStatus === "SCHEDULED" ? scheduledDate : null,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("inkforge_active_draft", JSON.stringify(draftData));

    // Also persist into in-memory/API list
    try {
      const existingRaw = localStorage.getItem("inkforge_all_posts") || "[]";
      const existing = JSON.parse(existingRaw);
      const postSlug = (title || "untitled-story")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const index = existing.findIndex((p: { slug: string }) => p.slug === postSlug);
      const postRecord = {
        id: `post-${Date.now()}`,
        ...draftData,
        slug: postSlug,
        author: {
          name: "Anonymous Scribe",
          role: "Founding Writer",
        },
      };

      if (index >= 0) {
        existing[index] = postRecord;
      } else {
        existing.unshift(postRecord);
      }

      localStorage.setItem("inkforge_all_posts", JSON.stringify(existing));
    } catch (err) {
      console.error("Local persistence error", err);
    }

    setTimeout(() => {
      setIsSaving(false);
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2500);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#f1f2f4]">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Top Control Bar */}
        <div className="mb-8 flex flex-col gap-4 border-b border-zinc-800/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-7 items-center rounded-full bg-amber-500/10 px-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
              Writer Studio
            </span>
            <span className="text-xs text-zinc-500">Draft v1.0</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Selector */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 focus:border-amber-500 focus:outline-none"
            >
              <option value="DRAFT">Draft</option>
              <option value="IN_REVIEW">Submit for Review</option>
              <option value="SCHEDULED">Schedule Post</option>
              <option value="PUBLISHED">Published</option>
            </select>

            {status === "SCHEDULED" && (
              <div className="flex items-center space-x-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-transparent text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => handleSave(status)}
              disabled={isSaving}
              className="flex items-center space-x-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? "Saving..." : "Save Draft"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatus("PUBLISHED");
                handleSave("PUBLISHED");
              }}
              className="flex items-center space-x-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-black transition-all hover:bg-amber-400 hover:shadow-md hover:shadow-amber-500/20 active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Publish Now</span>
            </button>
          </div>
        </div>

        {savedNotification && (
          <div className="mb-6 flex items-center space-x-2 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-4 py-2 text-xs text-emerald-300 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Story saved successfully to local studio archive.</span>
          </div>
        )}

        {/* Story Title & Subtitle */}
        <div className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="Title of your story..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent font-serif text-3xl font-extrabold tracking-tight text-white placeholder-zinc-600 focus:outline-none sm:text-5xl"
          />

          <input
            type="text"
            placeholder="Add an enticing subtitle or summary excerpt..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full bg-transparent text-lg text-zinc-400 placeholder-zinc-700 focus:outline-none"
          />
        </div>

        {/* Block Editor */}
        <div className="mb-12">
          <Editor
            initialContent={contentHtml}
            onChange={({ html }) => setContentHtml(html)}
          />
        </div>

        {/* Publishing Workflow Tips */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 text-sm text-zinc-400">
          <div className="flex items-center space-x-2 font-medium text-zinc-200 mb-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Inkforge Writing Tip</span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">
            Use the slash menu or highlight text to summon the floating formatting bar. Inkforge keeps your drafts auto-synchronized, and scheduled publications will release automatically when their target time triggers.
          </p>
        </div>
      </main>
    </div>
  );
}

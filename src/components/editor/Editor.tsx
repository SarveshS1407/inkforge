"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import {
  Underline,
  Highlight,
  CustomLink,
  CustomImage,
  TableBlock,
} from "./extensions";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Quote,
  List,
  ListOrdered,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  CodeXml,
  Sparkles,
  ChevronDown,
  X,
  Check,
  RemoveFormatting,
  ExternalLink,
} from "lucide-react";

interface EditorProps {
  initialContent?: string;
  placeholder?: string;
  documentKey?: string | null;
  onChange?: (data: { html: string; json: object; text: string }) => void;
}

export function Editor({
  initialContent = "",
  placeholder = "Start writing your piece... Use the toolbar above for formatting",
  documentKey,
  onChange,
}: EditorProps) {
  // Popover & modal states
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [imageTitle, setImageTitle] = useState("");

  const insertMenuRef = useRef<HTMLDivElement>(null);
  const lastLoadedDocKeyRef = useRef<string | null | undefined>(documentKey);

  // Close insert popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (insertMenuRef.current && !insertMenuRef.current.contains(event.target as Node)) {
        setInsertMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class:
              "bg-[var(--paper-warm)] border border-[var(--paper-border)] rounded-lg p-4 font-editorial-mono text-sm my-4 overflow-x-auto text-[var(--ink-primary)]",
          },
        },
      }),
      Underline,
      Highlight,
      CustomLink,
      CustomImage,
      TableBlock,
      Placeholder.configure({
        placeholder,
      }),
      Typography,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[500px] font-editorial-serif text-lg leading-[1.88] text-[var(--ink-primary)]",
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "k") {
          event.preventDefault();
          handleOpenLinkDialog();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange({
          html: editor.getHTML(),
          json: editor.getJSON(),
          text: editor.getText(),
        });
      }
    },
    immediatelyRender: false,
  });

  // Synchronize initial content or load new document on documentKey change
  useEffect(() => {
    if (!editor) return;

    if (documentKey !== undefined && documentKey !== lastLoadedDocKeyRef.current) {
      lastLoadedDocKeyRef.current = documentKey;
      editor.commands.setContent(initialContent || "");
      return;
    }

    if (initialContent && editor.isEmpty) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent, documentKey]);

  // Close menus/dialogs on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setInsertMenuOpen(false);
        setLinkDialogOpen(false);
        setImageDialogOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handlers for Link Dialog
  const handleOpenLinkDialog = useCallback(() => {
    if (!editor) return;
    const existingUrl = editor.getAttributes("link").href || "";
    setLinkUrl(existingUrl);
    setLinkDialogOpen(true);
    setInsertMenuOpen(false);
  }, [editor]);

  const handleApplyLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetMark("link").run();
    } else {
      let finalUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      editor.chain().focus().extendMarkRange("link").setMark("link", { href: finalUrl }).run();
    }
    setLinkDialogOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const handleRemoveLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetMark("link").run();
    setLinkDialogOpen(false);
    setLinkUrl("");
  }, [editor]);

  // Handlers for Image Dialog
  const handleOpenImageDialog = useCallback(() => {
    setImageSrc("");
    setImageTitle("");
    setImageDialogOpen(true);
    setInsertMenuOpen(false);
  }, []);

  const handleApplyImage = useCallback(() => {
    if (!editor || !imageSrc.trim()) return;
    editor.chain().focus().insertContent({
      type: "image",
      attrs: { src: imageSrc.trim(), title: imageTitle.trim() || undefined },
    }).run();
    setImageDialogOpen(false);
    setImageSrc("");
    setImageTitle("");
  }, [editor, imageSrc, imageTitle]);

  // Insert Table
  const handleInsertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: "tableBlock",
      attrs: {
        dataJson: JSON.stringify([
          ["Section", "Core Thesis", "Folio Ref"],
          ["Prologue", "The Philosophy of Permanence in Software", "p. 14"],
          ["Chapter I", "Architectural Endurance & Craft", "p. 28"],
          ["Chapter II", "Reclaiming the Sovereign Writer", "p. 42"],
        ]),
      },
    }).run();
    setInsertMenuOpen(false);
  }, [editor]);

  // Clear Formatting
  const handleClearFormatting = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] text-[var(--ink-muted)] font-editorial-mono text-xs shadow-xs">
        <span className="animate-pulse">Loading Writing Canvas...</span>
      </div>
    );
  }

  const wordCount = editor.getText().trim().split(/\s+/).filter(Boolean).length;
  const charCount = editor.getText().length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));

  return (
    <div className="book-jacket w-full rounded-xl transition-all focus-within:border-[var(--oxblood)] shadow-xs relative">
      {/* =====================================================================
          PROFESSIONAL EDITORIAL TOOLBAR
          5 Distinct Groups: Style · Inline · Structure · Insert · History
          ===================================================================== */}
      <div
        role="toolbar"
        aria-label="Manuscript Formatting Controls"
        className="sticky top-16 z-30 flex flex-wrap items-center gap-1.5 border-b border-[var(--editorial-rule)] bg-[var(--paper-warm)]/98 backdrop-blur-md px-3 sm:px-4 py-2 text-[var(--ink-secondary)] rounded-t-xl"
      >
        {/* GROUP 1: TEXT STYLE (Paragraph & Headings) */}
        <div className="flex items-center space-x-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`rounded px-2 py-1 text-xs font-editorial-sans transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("paragraph") && !editor.isActive("heading")
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] font-bold shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Normal Paragraph Style"
            aria-label="Normal Paragraph"
          >
            <span className="flex items-center space-x-1">
              <Pilcrow className="h-3.5 w-3.5" />
              <span className="hidden xl:inline text-[11px]">Normal</span>
            </span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`rounded px-2 py-1 font-editorial-serif text-xs font-bold transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("heading", { level: 1 })
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Heading 1 (Main Title)"
            aria-label="Heading 1"
          >
            H1
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`rounded px-2 py-1 font-editorial-serif text-xs font-semibold transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("heading", { level: 2 })
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Heading 2 (Section Title)"
            aria-label="Heading 2"
          >
            H2
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`rounded px-2 py-1 font-editorial-serif text-xs transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("heading", { level: 3 })
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Heading 3 (Subsection)"
            aria-label="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Group Divider */}
        <div className="h-4 w-[1px] bg-[var(--editorial-rule)] mx-1" aria-hidden="true" />

        {/* GROUP 2: INLINE FORMATTING */}
        <div className="flex items-center space-x-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rounded p-1.5 text-xs transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("bold")
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] font-bold shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Bold (Cmd+B)"
            aria-label="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rounded p-1.5 text-xs transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("italic")
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Italic (Cmd+I)"
            aria-label="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleMark("underline").run()}
            className={`rounded p-1.5 text-xs transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("underline")
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] font-bold shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Underline (Cmd+U)"
            aria-label="Underline"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`rounded p-1.5 text-xs transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("strike")
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Strikethrough"
            aria-label="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`rounded p-1.5 text-xs transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("code")
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Inline Code (Cmd+E)"
            aria-label="Inline Code"
          >
            <Code className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleMark("highlight").run()}
            className={`rounded p-1.5 text-xs transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("highlight")
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] font-bold shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Highlight Text (Cmd+Shift+H)"
            aria-label="Highlight Text"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClearFormatting}
            className="rounded p-1.5 text-xs transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--oxblood)]"
            title="Clear Formatting"
            aria-label="Clear Formatting"
          >
            <RemoveFormatting className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Group Divider */}
        <div className="h-4 w-[1px] bg-[var(--editorial-rule)] mx-1" aria-hidden="true" />

        {/* GROUP 3: STRUCTURE & LISTS */}
        <div className="flex items-center space-x-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("bulletList")
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Bullet List"
            aria-label="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("orderedList")
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Numbered List"
            aria-label="Numbered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("blockquote")
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Pullquote / Blockquote"
            aria-label="Pullquote / Blockquote"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
              editor.isActive("codeBlock")
                ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-2xs border border-[var(--paper-border)]"
                : ""
            }`}
            title="Code Block"
            aria-label="Code Block"
          >
            <CodeXml className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)]"
            title="Section Divider Rule"
            aria-label="Section Divider"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Group Divider */}
        <div className="h-4 w-[1px] bg-[var(--editorial-rule)] mx-1" aria-hidden="true" />

        {/* GROUP 4: INSERT MENU POPOVER */}
        <div className="relative" ref={insertMenuRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setInsertMenuOpen(!insertMenuOpen)}
            className="flex items-center space-x-1.5 rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1 text-xs font-editorial-sans font-semibold text-[var(--ink-primary)] shadow-2xs transition-colors hover:border-[var(--oxblood)] hover:text-[var(--oxblood)]"
            title="Insert Block Components"
            aria-haspopup="true"
            aria-expanded={insertMenuOpen}
          >
            <span>Insert</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {/* Insert Dropdown Menu */}
          {insertMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-52 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 font-editorial-sans text-xs">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleOpenLinkDialog}
                className="flex w-full items-center space-x-2.5 rounded-md px-2.5 py-1.5 text-left text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors"
              >
                <LinkIcon className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                <div className="flex-1">
                  <div className="font-medium">Hyperlink</div>
                  <div className="text-[10px] text-[var(--ink-muted)]">Embed web reference</div>
                </div>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleOpenImageDialog}
                className="flex w-full items-center space-x-2.5 rounded-md px-2.5 py-1.5 text-left text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors"
              >
                <ImageIcon className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                <div className="flex-1">
                  <div className="font-medium">Image / Figure</div>
                  <div className="text-[10px] text-[var(--ink-muted)]">Insert illustration with caption</div>
                </div>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleInsertTable}
                className="flex w-full items-center space-x-2.5 rounded-md px-2.5 py-1.5 text-left text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors"
              >
                <TableIcon className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                <div className="flex-1">
                  <div className="font-medium">Editorial Table</div>
                  <div className="text-[10px] text-[var(--ink-muted)]">Structured comparative grid</div>
                </div>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().toggleCodeBlock().run();
                  setInsertMenuOpen(false);
                }}
                className="flex w-full items-center space-x-2.5 rounded-md px-2.5 py-1.5 text-left text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors"
              >
                <CodeXml className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                <div className="flex-1">
                  <div className="font-medium">Code Block</div>
                  <div className="text-[10px] text-[var(--ink-muted)]">Monospaced formatted block</div>
                </div>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().toggleBlockquote().run();
                  setInsertMenuOpen(false);
                }}
                className="flex w-full items-center space-x-2.5 rounded-md px-2.5 py-1.5 text-left text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors"
              >
                <Quote className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                <div className="flex-1">
                  <div className="font-medium">Pullquote</div>
                  <div className="text-[10px] text-[var(--ink-muted)]">Prominent excerpt callout</div>
                </div>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().setHorizontalRule().run();
                  setInsertMenuOpen(false);
                }}
                className="flex w-full items-center space-x-2.5 rounded-md px-2.5 py-1.5 text-left text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors"
              >
                <Minus className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                <div className="flex-1">
                  <div className="font-medium">Section Divider</div>
                  <div className="text-[10px] text-[var(--ink-muted)]">Horizontal pause rule</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Quick Direct Link Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleOpenLinkDialog}
          className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
            editor.isActive("link")
              ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-2xs border border-[var(--paper-border)] font-bold"
              : ""
          }`}
          title="Insert or Edit Link (Cmd+K)"
          aria-label="Insert Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </button>

        {/* GROUP 5: HISTORY (Undo / Redo) */}
        <div className="ml-auto flex items-center space-x-1">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] disabled:opacity-30 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[var(--oxblood)]"
            title="Undo (Cmd+Z)"
            aria-label="Undo"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] disabled:opacity-30 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[var(--oxblood)]"
            title="Redo (Cmd+Shift+Z)"
            aria-label="Redo"
          >
            <Redo className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          LINK DIALOG POPOVER
          ===================================================================== */}
      {linkDialogOpen && (
        <div className="absolute left-6 top-14 z-40 w-80 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 shadow-xl animate-in fade-in font-editorial-sans text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--editorial-rule)] mb-3">
            <span className="font-bold text-[var(--oxblood)] uppercase tracking-wider font-editorial-mono text-[10px]">
              Set Web Hyperlink
            </span>
            <button
              type="button"
              onClick={() => setLinkDialogOpen(false)}
              className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-editorial-mono text-[var(--ink-muted)] mb-1">
                Destination URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/essay"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyLink();
                  }
                }}
                className="w-full rounded border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-2.5 py-1.5 text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {editor.isActive("link") && (
                <button
                  type="button"
                  onClick={handleRemoveLink}
                  className="inline-flex items-center space-x-1 text-[11px] text-[var(--oxblood)] hover:underline"
                >
                  <Unlink className="h-3 w-3" />
                  <span>Remove</span>
                </button>
              )}
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setLinkDialogOpen(false)}
                  className="rounded px-2.5 py-1 text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyLink}
                  className="rounded bg-[var(--oxblood)] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[var(--oxblood-hover)] shadow-2xs"
                >
                  Apply Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          IMAGE INSERTION DIALOG
          ===================================================================== */}
      {imageDialogOpen && (
        <div className="absolute left-6 top-14 z-40 w-96 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 shadow-xl animate-in fade-in font-editorial-sans text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--editorial-rule)] mb-3">
            <span className="font-bold text-[var(--oxblood)] uppercase tracking-wider font-editorial-mono text-[10px]">
              Embed Manuscript Illustration
            </span>
            <button
              type="button"
              onClick={() => setImageDialogOpen(false)}
              className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-editorial-mono text-[var(--ink-muted)] mb-1">
                Image Web Address (URL)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={imageSrc}
                onChange={(e) => setImageSrc(e.target.value)}
                className="w-full rounded border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-2.5 py-1.5 text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-editorial-mono text-[var(--ink-muted)] mb-1">
                Caption / Scholarly Attribution (Optional)
              </label>
              <input
                type="text"
                placeholder="Figure 1: Architectural plates from the 1892 edition"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                className="w-full rounded border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-2.5 py-1.5 text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setImageDialogOpen(false)}
                className="rounded px-2.5 py-1 text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyImage}
                disabled={!imageSrc.trim()}
                className="rounded bg-[var(--oxblood)] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[var(--oxblood-hover)] shadow-2xs disabled:opacity-40"
              >
                Insert Figure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MANUSCRIPT WRITING CANVAS
          ===================================================================== */}
      <div className="p-8 md:p-14 bg-[var(--paper-surface)] rounded-b-xl min-h-[520px]">
        <EditorContent editor={editor} />
      </div>

      {/* =====================================================================
          BOTTOM SCRIBE STATUS STRIP
          Real-time metrics, character count, and persistent autosave pulse
          ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--editorial-rule)] bg-[var(--paper-warm)] px-6 py-2.5 font-editorial-mono text-[11px] text-[var(--ink-muted)] rounded-b-xl">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <span>
            <strong className="text-[var(--ink-primary)] font-semibold">{wordCount}</strong> words
          </span>
          <span>•</span>
          <span>
            <strong className="text-[var(--ink-primary)] font-semibold">{charCount}</strong> characters
          </span>
          <span>•</span>
          <span>~{readingMinutes} min read</span>
        </div>

        <div className="flex items-center space-x-2 text-[var(--oxblood)] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--oxblood)] animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider">Local Sanctuary Autosave</span>
        </div>
      </div>
    </div>
  );
}

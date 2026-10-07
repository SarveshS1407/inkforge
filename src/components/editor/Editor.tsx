"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Minus,
  Undo,
  Redo,
} from "lucide-react";

interface EditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange?: (data: { html: string; json: object; text: string }) => void;
}

export function Editor({
  initialContent = "",
  placeholder = "Begin drafting your manuscript here... Press '/' for block commands",
  onChange,
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[460px] font-editorial-serif text-lg leading-[1.85] text-[var(--ink-primary)]",
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

  if (!editor) {
    return (
      <div className="flex min-h-[460px] items-center justify-center rounded-xl border border-[var(--paper-border)] bg-[var(--paper-card)] text-[var(--ink-muted)] font-editorial-mono text-xs">
        Preparing manuscript desk...
      </div>
    );
  }

  const wordCount = editor.getText().trim().split(/\s+/).filter(Boolean).length;
  const charCount = editor.getText().length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));

  return (
    <div className="w-full rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-sm transition-all focus-within:border-[var(--oxblood)]/60">
      {/* Editor Tool Ribbon */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--editorial-rule)] bg-[var(--paper-card)] px-4 py-2.5 text-[var(--ink-secondary)]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
            editor.isActive("bold") ? "bg-[var(--paper-surface)] text-[var(--oxblood)] font-bold shadow-xs" : ""
          }`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
            editor.isActive("italic") ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-xs" : ""
          }`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
            editor.isActive("strike") ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-xs" : ""
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
            editor.isActive("code") ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-xs" : ""
          }`}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="mx-1.5 h-4 w-[1px] bg-[var(--editorial-rule)]" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
            editor.isActive("heading", { level: 1 }) ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-xs" : ""
          }`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
            editor.isActive("heading", { level: 2 }) ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-xs" : ""
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
            editor.isActive("heading", { level: 3 }) ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-xs" : ""
          }`}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="mx-1.5 h-4 w-[1px] bg-[var(--editorial-rule)]" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
            editor.isActive("bulletList") ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-xs" : ""
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
            editor.isActive("orderedList") ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-xs" : ""
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] ${
            editor.isActive("blockquote") ? "bg-[var(--paper-surface)] text-[var(--oxblood)] shadow-xs" : ""
          }`}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)]"
          title="Divider"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center space-x-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] disabled:opacity-30"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rounded p-1.5 transition-colors hover:bg-[var(--paper-surface)] disabled:opacity-30"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor Manuscript Surface */}
      <div className="p-8 md:p-12">
        <EditorContent editor={editor} />
      </div>

      {/* Scribe Ledger Bar */}
      <div className="flex items-center justify-between border-t border-[var(--editorial-rule)] bg-[var(--paper-card)] px-6 py-3 font-editorial-mono text-[11px] text-[var(--ink-muted)]">
        <div className="flex items-center space-x-4">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
          <span>•</span>
          <span>~{readingMinutes} min read</span>
        </div>
        <div className="flex items-center space-x-2 text-[var(--oxblood)] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--oxblood)] animate-pulse" />
          <span className="uppercase tracking-wider">Sanctuary Autosave Active</span>
        </div>
      </div>
    </div>
  );
}

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
  placeholder = "Write your story here... Press '/' for commands",
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
        class: "prose prose-invert prose-lg max-w-none focus:outline-none min-h-[420px] font-sans selection:bg-amber-500/30",
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
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-500">
        Loading editor...
      </div>
    );
  }

  const wordCount = editor.getText().trim().split(/\s+/).filter(Boolean).length;
  const charCount = editor.getText().length;

  return (
    <div className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 shadow-xl backdrop-blur-sm transition-all focus-within:border-zinc-700">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800/80 bg-zinc-900/50 px-3 py-2 text-zinc-400">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white ${
            editor.isActive("bold") ? "bg-zinc-800 text-amber-400" : ""
          }`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white ${
            editor.isActive("italic") ? "bg-zinc-800 text-amber-400" : ""
          }`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white ${
            editor.isActive("strike") ? "bg-zinc-800 text-amber-400" : ""
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white ${
            editor.isActive("code") ? "bg-zinc-800 text-amber-400" : ""
          }`}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-[1px] bg-zinc-800" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white ${
            editor.isActive("heading", { level: 1 }) ? "bg-zinc-800 text-amber-400" : ""
          }`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white ${
            editor.isActive("heading", { level: 2 }) ? "bg-zinc-800 text-amber-400" : ""
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white ${
            editor.isActive("heading", { level: 3 }) ? "bg-zinc-800 text-amber-400" : ""
          }`}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-[1px] bg-zinc-800" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white ${
            editor.isActive("bulletList") ? "bg-zinc-800 text-amber-400" : ""
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white ${
            editor.isActive("orderedList") ? "bg-zinc-800 text-amber-400" : ""
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white ${
            editor.isActive("blockquote") ? "bg-zinc-800 text-amber-400" : ""
          }`}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white"
          title="Divider"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center space-x-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-30"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rounded p-1.5 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-30"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-6 md:p-8">
        <EditorContent editor={editor} />
      </div>

      {/* Footer Meta / Counter */}
      <div className="flex items-center justify-between border-t border-zinc-900 bg-zinc-950/40 px-6 py-2.5 text-xs text-zinc-500">
        <div className="flex items-center space-x-4">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
          <span>•</span>
          <span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
        </div>
        <div className="flex items-center space-x-2 text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500/80 animate-pulse" />
          <span>Autosave Ready</span>
        </div>
      </div>
    </div>
  );
}

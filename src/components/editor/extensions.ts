"use client";

import { Mark, Node, mergeAttributes } from "@tiptap/core";

// ============================================================================
// 1. UNDERLINE MARK
// ============================================================================
export const Underline = Mark.create({
  name: "underline",

  parseHTML() {
    return [
      { tag: "u" },
      {
        style: "text-decoration",
        consuming: false,
        getAttrs: (style) => ((style as string).includes("underline") ? {} : false),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(HTMLAttributes), 0];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-u": () => this.editor.commands.toggleMark(this.name),
      "Mod-U": () => this.editor.commands.toggleMark(this.name),
    };
  },
});

// ============================================================================
// 2. HIGHLIGHT MARK (Editorial Ochre / Amber Wash)
// ============================================================================
export const Highlight = Mark.create({
  name: "highlight",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "bg-[var(--oxblood-subtle)] text-[var(--oxblood)] px-1 py-0.5 rounded font-medium",
      },
    };
  },

  parseHTML() {
    return [{ tag: "mark" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-h": () => this.editor.commands.toggleMark(this.name),
      "Mod-Shift-H": () => this.editor.commands.toggleMark(this.name),
    };
  },
});

// ============================================================================
// 3. EDITORIAL HYPERLINK MARK
// ============================================================================
export const CustomLink = Mark.create({
  name: "link",
  priority: 1000,
  keepOnSplit: false,

  addOptions() {
    return {
      HTMLAttributes: {
        class:
          "editorial-link cursor-pointer text-[var(--oxblood)] underline decoration-[var(--oxblood)]/40 hover:decoration-[var(--oxblood)] underline-offset-4 transition-colors",
        target: "_blank",
        rel: "noopener noreferrer",
      },
    };
  },

  addAttributes() {
    return {
      href: {
        default: null,
      },
      target: {
        default: this.options.HTMLAttributes.target,
      },
      rel: {
        default: this.options.HTMLAttributes.rel,
      },
    };
  },

  parseHTML() {
    return [{ tag: "a[href]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["a", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});

// ============================================================================
// 4. EDITORIAL FIGURE / IMAGE BLOCK
// ============================================================================
export const CustomImage = Node.create({
  name: "image",
  group: "block",
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }, { tag: "figure" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, title } = HTMLAttributes;
    return [
      "figure",
      { class: "my-8 flex flex-col items-center group relative" },
      [
        "img",
        {
          src,
          alt: alt || "Editorial Illustration",
          class:
            "rounded-xl border border-[var(--paper-border)] max-h-[520px] w-auto max-w-full shadow-md object-cover",
        },
      ],
      title
        ? [
            "figcaption",
            {
              class:
                "mt-2.5 text-center font-editorial-mono text-xs italic text-[var(--ink-muted)] tracking-wide max-w-md",
            },
            title,
          ]
        : ["span", { class: "hidden" }],
    ];
  },
});

// ============================================================================
// 5. EDITORIAL TABLE BLOCK
// ============================================================================
export const TableBlock = Node.create({
  name: "tableBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      dataJson: {
        default: JSON.stringify([
          ["Folio", "Subject Treatise", "Classification"],
          ["Folio I", "Systems Architecture & Endurance", "Monograph"],
          ["Folio II", "The Sovereign Writer's Ledger", "Dispatch"],
        ]),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='editorial-table']" }];
  },

  renderHTML({ HTMLAttributes }) {
    let rows: string[][] = [];
    try {
      rows = JSON.parse(HTMLAttributes.dataJson || "[]");
    } catch {
      rows = [["Column A", "Column B"]];
    }

    const header = rows[0] || [];
    const body = rows.slice(1);

    return [
      "div",
      {
        "data-type": "editorial-table",
        class: "my-8 overflow-x-auto rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-2 shadow-xs",
      },
      [
        "table",
        { class: "w-full border-collapse font-editorial-sans text-xs sm:text-sm text-[var(--ink-primary)]" },
        [
          "thead",
          {},
          [
            "tr",
            { class: "border-b border-[var(--editorial-rule)] bg-[var(--paper-warm)] font-bold text-[var(--oxblood)]" },
            ...header.map((col: string) => ["th", { class: "p-3 text-left font-editorial-mono tracking-wider uppercase text-[10px]" }, col]),
          ],
        ],
        [
          "tbody",
          { class: "divide-y divide-[var(--paper-border-subtle)]" },
          ...body.map((row: string[]) => [
            "tr",
            { class: "hover:bg-[var(--paper-warm)]/40 transition-colors" },
            ...row.map((cell: string) => ["td", { class: "p-3" }, cell]),
          ]),
        ],
      ],
    ];
  },
});

// ============================================================================
// 6. FONT FAMILY MARK (Curated Editorial Font Families)
// ============================================================================
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontFamily: {
      setFontFamily: (font: string) => ReturnType;
      unsetFontFamily: () => ReturnType;
    };
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FONT_FAMILY_STYLES: Record<string, { label: string; style: string; className: string }> = {
  "editorial-serif": {
    label: "Editorial Serif",
    style: "font-family: var(--font-editorial-serif, 'Newsreader', Georgia, serif);",
    className: "font-editorial-serif",
  },
  "editorial-sans": {
    label: "Editorial Sans",
    style: "font-family: var(--font-editorial-sans, Inter, sans-serif);",
    className: "font-editorial-sans",
  },
  "editorial-mono": {
    label: "Editorial Mono",
    style: "font-family: var(--font-editorial-mono, monospace);",
    className: "font-editorial-mono",
  },
  "garamond": {
    label: "Classical Garamond",
    style: "font-family: 'EB Garamond', Garamond, Georgia, serif;",
    className: "font-serif",
  },
  "georgia": {
    label: "Literary Georgia",
    style: "font-family: Georgia, 'Times New Roman', serif;",
    className: "font-serif",
  },
};

export const FontFamily = Mark.create({
  name: "fontFamily",

  addAttributes() {
    return {
      font: {
        default: "editorial-serif",
        parseHTML: (element) => element.getAttribute("data-font-family") || "editorial-serif",
        renderHTML: (attributes) => ({
          "data-font-family": attributes.font,
          style: FONT_FAMILY_STYLES[attributes.font]?.style,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-font-family]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontFamily:
        (font: string) =>
        ({ chain }) => {
          return chain().setMark(this.name, { font }).run();
        },
      unsetFontFamily:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});

// ============================================================================
// 7. FONT SIZE MARK (Editorial Typographic Scale)
// ============================================================================
export const FONT_SIZE_STYLES: Record<string, { label: string; size: string; style: string; className: string }> = {
  "sm": {
    label: "Small · 14px",
    size: "sm",
    style: "font-size: 0.875rem; line-height: 1.6;",
    className: "text-sm",
  },
  "base": {
    label: "Normal · 16px",
    size: "base",
    style: "font-size: 1rem; line-height: 1.7;",
    className: "text-base",
  },
  "lg": {
    label: "Reading · 18px",
    size: "lg",
    style: "font-size: 1.125rem; line-height: 1.8;",
    className: "text-lg",
  },
  "xl": {
    label: "Lead · 22px",
    size: "xl",
    style: "font-size: 1.375rem; line-height: 1.7;",
    className: "text-xl",
  },
  "2xl": {
    label: "Display · 28px",
    size: "2xl",
    style: "font-size: 1.75rem; line-height: 1.5;",
    className: "text-2xl font-medium",
  },
};

export const FontSize = Mark.create({
  name: "fontSize",

  addAttributes() {
    return {
      size: {
        default: "lg",
        parseHTML: (element) => element.getAttribute("data-font-size") || "lg",
        renderHTML: (attributes) => ({
          "data-font-size": attributes.size,
          style: FONT_SIZE_STYLES[attributes.size]?.style,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-font-size]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }) => {
          return chain().setMark(this.name, { size }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});

"use client";

import React, { useMemo } from "react";

interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, any>;
  content?: ProseMirrorNode[];
  marks?: Array<{
    type: string;
    attrs?: Record<string, any>;
  }>;
  text?: string;
}

interface SafeContentRendererProps {
  contentJson?: string | object | null;
  contentHtml?: string | null;
  className?: string;
}

import { sanitizeUrl, sanitizeHtml } from "@/lib/sanitizer";
export { sanitizeUrl, sanitizeHtml };

/**
 * Recursive renderer for ProseMirror JSON AST.
 * Because this renders native React DOM elements, text nodes are automatically
 * escaped by React and 100% immune to XSS injection.
 */
function renderProseMirrorNode(
  node: ProseMirrorNode,
  key: string | number
): React.ReactNode {
  // 1. Text node with potential marks
  if (node.type === "text" && typeof node.text === "string") {
    let result: React.ReactNode = node.text;

    if (node.marks && node.marks.length > 0) {
      for (const [markIndex, mark] of node.marks.entries()) {
        const markKey = `${key}-mark-${markIndex}`;
        switch (mark.type) {
          case "bold":
            result = <strong key={markKey}>{result}</strong>;
            break;
          case "italic":
            result = <em key={markKey}>{result}</em>;
            break;
          case "underline":
            result = <u key={markKey}>{result}</u>;
            break;
          case "strike":
            result = <s key={markKey}>{result}</s>;
            break;
          case "code":
            result = (
              <code
                key={markKey}
                className="rounded bg-[var(--paper-warm)] px-1.5 py-0.5 font-editorial-mono text-[0.88em] text-[var(--oxblood)] border border-[var(--paper-border)]"
              >
                {result}
              </code>
            );
            break;
          case "highlight":
            result = (
              <mark
                key={markKey}
                className="bg-[var(--oxblood-subtle)] text-[var(--oxblood)] px-1 py-0.5 rounded font-medium"
              >
                {result}
              </mark>
            );
            break;
          case "link": {
            const href = sanitizeUrl(mark.attrs?.href);
            result = (
              <a
                key={markKey}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="editorial-link text-[var(--oxblood)] underline decoration-[var(--oxblood)]/40 hover:decoration-[var(--oxblood)] underline-offset-4 transition-colors"
              >
                {result}
              </a>
            );
            break;
          }
          case "fontFamily": {
            const font = mark.attrs?.font || "editorial-serif";
            const fontFamilyStyle =
              font === "editorial-sans"
                ? "var(--font-editorial-sans, Inter, sans-serif)"
                : font === "editorial-mono"
                ? "var(--font-editorial-mono, monospace)"
                : font === "garamond"
                ? "'EB Garamond', Garamond, Georgia, serif"
                : font === "georgia"
                ? "Georgia, serif"
                : "var(--font-editorial-serif, Georgia, serif)";
            result = (
              <span
                key={markKey}
                data-font-family={font}
                style={{ fontFamily: fontFamilyStyle }}
              >
                {result}
              </span>
            );
            break;
          }
          case "fontSize": {
            const size = mark.attrs?.size || "lg";
            const fontSizeStyle =
              size === "sm"
                ? "0.875rem"
                : size === "base"
                ? "1rem"
                : size === "xl"
                ? "1.375rem"
                : size === "2xl"
                ? "1.75rem"
                : "1.125rem";
            result = (
              <span
                key={markKey}
                data-font-size={size}
                style={{ fontSize: fontSizeStyle }}
              >
                {result}
              </span>
            );
            break;
          }
          default:
            break;
        }
      }
    }
    return <React.Fragment key={key}>{result}</React.Fragment>;
  }

  // 2. Block and structural nodes
  const children = node.content
    ? node.content.map((child, index) =>
        renderProseMirrorNode(child, `${key}-${index}`)
      )
    : null;

  switch (node.type) {
    case "doc":
      return <div key={key}>{children}</div>;

    case "paragraph":
      return (
        <p key={key} className="leading-[1.88] my-4 text-[var(--ink-primary)]">
          {children || <br />}
        </p>
      );

    case "heading": {
      const level = node.attrs?.level || 1;
      if (level === 1) {
        return (
          <h1
            key={key}
            className="font-editorial-serif text-3xl sm:text-4xl font-bold mt-8 mb-4 text-[var(--ink-primary)] tracking-tight"
          >
            {children}
          </h1>
        );
      }
      if (level === 2) {
        return (
          <h2
            key={key}
            className="font-editorial-serif text-2xl sm:text-3xl font-bold mt-6 mb-3 text-[var(--ink-primary)] tracking-tight"
          >
            {children}
          </h2>
        );
      }
      return (
        <h3
          key={key}
          className="font-editorial-serif text-xl sm:text-2xl font-bold mt-5 mb-2 text-[var(--ink-primary)]"
        >
          {children}
        </h3>
      );
    }

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-2 border-[var(--oxblood)] pl-4 italic my-6 text-[var(--ink-secondary)] font-editorial-serif text-lg leading-relaxed"
        >
          {children}
        </blockquote>
      );

    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-6 my-4 space-y-1.5 leading-relaxed text-[var(--ink-primary)]">
          {children}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} className="list-decimal pl-6 my-4 space-y-1.5 leading-relaxed text-[var(--ink-primary)]">
          {children}
        </ol>
      );

    case "listItem":
      return <li key={key} className="leading-relaxed">{children}</li>;

    case "codeBlock":
      return (
        <pre
          key={key}
          className="bg-[var(--paper-warm)] border border-[var(--paper-border)] rounded-lg p-4 font-editorial-mono text-sm my-6 overflow-x-auto text-[var(--ink-primary)] leading-normal"
        >
          <code>{children}</code>
        </pre>
      );

    case "horizontalRule":
      return <hr key={key} className="my-8 border-[var(--editorial-rule)]" />;

    case "image": {
      const src = sanitizeUrl(node.attrs?.src);
      const alt = node.attrs?.alt || "Manuscript illustration";
      const title = node.attrs?.title;
      return (
        <figure key={key} className="my-8 flex flex-col items-center group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="rounded-xl border border-[var(--paper-border)] max-h-[520px] w-auto max-w-full shadow-md object-cover"
          />
          {title && (
            <figcaption className="mt-2.5 text-center font-editorial-mono text-xs italic text-[var(--ink-muted)] tracking-wide max-w-md">
              {title}
            </figcaption>
          )}
        </figure>
      );
    }

    case "tableBlock": {
      let rows: string[][] = [];
      try {
        rows = JSON.parse(node.attrs?.dataJson || "[]");
      } catch {
        rows = [];
      }
      if (rows.length === 0) return null;
      const header = rows[0] || [];
      const body = rows.slice(1);
      return (
        <div
          key={key}
          className="my-8 overflow-x-auto rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-2 shadow-xs"
        >
          <table className="w-full border-collapse font-editorial-sans text-xs sm:text-sm text-[var(--ink-primary)]">
            <thead>
              <tr className="border-b border-[var(--editorial-rule)] bg-[var(--paper-warm)] font-bold text-[var(--oxblood)]">
                {header.map((col, idx) => (
                  <th
                    key={idx}
                    className="p-3 text-left font-editorial-mono tracking-wider uppercase text-[10px]"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--paper-border)]/40">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[var(--paper-warm)]/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return <div key={key}>{children}</div>;
  }
}

/**
 * Universal Safe Content Renderer.
 * Primary mode: parses and renders ProseMirror JSON AST directly into React elements (0% XSS risk).
 * Fallback mode: sanitizes HTML through a strict whitelist sanitizer.
 */
export function SafeContentRenderer({
  contentJson,
  contentHtml,
  className = "font-editorial-serif text-lg leading-[1.88] text-[var(--ink-primary)] space-y-4",
}: SafeContentRendererProps) {
  const ast = useMemo<ProseMirrorNode | null>(() => {
    if (!contentJson) return null;
    try {
      if (typeof contentJson === "string") {
        const parsed = JSON.parse(contentJson);
        return parsed && parsed.type === "doc" ? parsed : null;
      }
      if (typeof contentJson === "object" && contentJson !== null && (contentJson as any).type === "doc") {
        return contentJson as ProseMirrorNode;
      }
    } catch {
      return null;
    }
    return null;
  }, [contentJson]);

  // Priority 1: ProseMirror AST rendering
  if (ast) {
    return (
      <div className={className}>
        {renderProseMirrorNode(ast, "root")}
      </div>
    );
  }

  // Priority 2: Sanitized HTML rendering
  if (contentHtml) {
    const sanitized = sanitizeHtml(contentHtml);
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  return (
    <p className="italic text-[var(--ink-muted)]">
      No prose inscribed in this manuscript yet.
    </p>
  );
}

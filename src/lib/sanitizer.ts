/**
 * INKFORGE — CONTENT & URL SANITIZER
 * Zero-dependency security sanitizer for HTML and URLs to prevent XSS.
 */

/**
 * Strict URL sanitizer preventing javascript:, data:, and vbscript: XSS vectors.
 */
export function sanitizeUrl(url?: string): string {
  if (!url) return "#";
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:")
  ) {
    return "#";
  }
  return trimmed;
}

/**
 * Lightweight, robust HTML sanitizer for untrusted HTML strings.
 * Strips script tags, styles, iframes, inline event handlers, and malicious protocols.
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return "";

  // 1. Remove dangerous executable tags and contents
  let clean = dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
    .replace(/<base\b[^>]*>/gi, "");

  // 2. Remove all inline event handlers (onload, onerror, onclick, etc.)
  clean = clean.replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 3. Neutralize javascript: or data: protocols inside href and src
  clean = clean.replace(
    /\s(href|src)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi,
    ' $1="#"'
  );
  clean = clean.replace(
    /\s(href|src)\s*=\s*(?:'data:[^']*'|"data:[^"]*"|data:[^\s>]+)/gi,
    ' $1="#"'
  );

  // 4. Ensure all links have rel="noopener noreferrer"
  clean = clean.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
    if (!attrs.includes('rel="noopener noreferrer"')) {
      return `<a ${attrs} rel="noopener noreferrer" target="_blank">`;
    }
    return match;
  });

  return clean;
}

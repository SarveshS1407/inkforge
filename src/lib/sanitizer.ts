/**
 * INKFORGE — CONTENT & URL SANITIZER
 * Zero-dependency security sanitizer for HTML and URLs to prevent XSS and protocol smuggling.
 */

/**
 * Strict URL sanitizer allowing only safe protocols (http, https, mailto, tel)
 * or verified relative paths (/slug, #anchor, ?query, ./path, ../path).
 * Blocks javascript:, vbscript:, data:, blob:, file:, protocol-relative (//),
 * control characters, and malformed URI schemes.
 */
export function sanitizeUrl(url?: string): string {
  if (!url || typeof url !== "string") return "#";

  // Strip control characters (ASCII 0-31 and 127) and trim
  const trimmed = url.replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (!trimmed) return "#";

  // Disallow protocol-relative URLs or backslash bypasses (e.g. "//evil.com", "/\evil.com", "\\evil.com")
  const normalizedPrefix = trimmed.replace(/\\/g, "/");
  if (normalizedPrefix.startsWith("//")) {
    return "#";
  }

  // Reject backslashes in URL paths
  if (trimmed.includes("\\")) {
    return "#";
  }


  // Safe relative paths: internal navigation, section anchors, relative assets
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("?") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../")
  ) {
    // Check for embedded forbidden protocols or control escapes in relative path
    const lowerRelative = trimmed.toLowerCase();
    if (
      lowerRelative.includes("javascript:") ||
      lowerRelative.includes("vbscript:") ||
      lowerRelative.includes("data:") ||
      lowerRelative.includes("blob:")
    ) {
      return "#";
    }
    return trimmed;
  }

  // Absolute URL validation
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();

    // Whitelist safe schemes
    if (["http:", "https:", "mailto:", "tel:"].includes(protocol)) {
      // Require hostname for http/https to prevent malformed or origin-less URIs
      if ((protocol === "http:" || protocol === "https:") && !parsed.hostname) {
        return "#";
      }
      return trimmed;
    }

    return "#";
  } catch {
    // If not a valid parseable URL and not starting with safe relative path, reject
    return "#";
  }
}

/**
 * Robust, multi-pass HTML sanitizer for untrusted HTML strings.
 * Strips script tags, styles, iframes, embeddings, forms, inline event handlers,
 * and neutralizes dangerous protocols in attributes.
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== "string") return "";

  let prev = "";
  let clean = dirtyHtml;

  // Run up to 5 passes to neutralize nested or bypass payloads (e.g., <scr<script>ipt>)
  for (let pass = 0; pass < 5; pass++) {
    prev = clean;

    // 1. Strip null bytes and non-printable control characters
    clean = clean.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");

    // 2. Strip HTML comments
    clean = clean.replace(/<!--[\s\S]*?-->/g, "");

    // 3. Remove dangerous executable/container tags and ALL their contents
    const dangerousTags = [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "applet",
      "frame",
      "frameset",
      "svg",
      "math",
      "base",
      "link",
      "meta",
      "form",
      "button",
      "textarea",
      "select",
      "option",
      "keygen",
    ];

    for (const tag of dangerousTags) {
      // Paired tags with inner content
      const pairedRegex = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi");
      clean = clean.replace(pairedRegex, "");
      // Unclosed or self-closing tags
      const singleRegex = new RegExp(`<${tag}\\b[^>]*>`, "gi");
      clean = clean.replace(singleRegex, "");
    }

    // 4. Strip any inline event handlers on ANY tag (e.g., onload, onerror, onclick, ontoggle)
    // Matches on[a-zA-Z]+ preceded by whitespace, slash, or start of attribute list
    clean = clean.replace(/[\s/](?:on[a-zA-Z]+)\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, " ");

    // 5. Neutralize dangerous URL schemes in href, src, action, formaction, poster
    clean = clean.replace(
      /(\s(?:href|src|action|formaction|poster)\s*=\s*)(["'])(?:\s*(?:javascript|vbscript|data|blob|file):[\s\S]*?)\2/gi,
      '$1$2#$2'
    );
    clean = clean.replace(
      /(\s(?:href|src|action|formaction|poster)\s*=\s*)(?:javascript|vbscript|data|blob|file):[^\s>]+/gi,
      '$1"#'
    );

    if (clean === prev) break;
  }

  // 6. Strict attribute URL sanitization on href and src
  clean = clean.replace(
    /(\s(?:href|src)\s*=\s*)(["'])([\s\S]*?)\2/gi,
    (match, prefix, quote, url) => {
      const sanitized = sanitizeUrl(url);
      return `${prefix}${quote}${sanitized}${quote}`;
    }
  );

  // 7. Ensure anchor links have rel="noopener noreferrer" and target="_blank"
  clean = clean.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
    let updated = attrs;
    if (!attrs.includes("rel=")) {
      updated += ' rel="noopener noreferrer"';
    } else {
      updated = updated.replace(/rel=(["'])[^"']*\1/i, 'rel="noopener noreferrer"');
    }
    if (!attrs.includes("target=")) {
      updated += ' target="_blank"';
    }
    return `<a${updated}>`;
  });

  return clean;
}

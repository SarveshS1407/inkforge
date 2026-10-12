/**
 * INKFORGE — CONTENT & URL SANITIZER (PHASE 9 PRODUCTION HARDENED)
 * Multi-pass zero-dependency security sanitizer for HTML and URLs to prevent XSS,
 * mutated XSS (mXSS), protocol smuggling, and entity-encoded evasion.
 */

/**
 * Normalizes and decodes entity-encoded characters to uncover obfuscated URL schemes.
 */
function decodeAndNormalizeUrl(raw: string): string {
  // Strip null bytes, non-printable control characters, and zero-width spaces
  let str = raw
    .replace(/[\x00-\x1f\x7f\u200B-\u200D\uFEFF]/g, "")
    .trim();

  // Iteratively decode numeric and named HTML entities (up to 3 passes)
  for (let pass = 0; pass < 3; pass++) {
    const prev = str;
    str = str.replace(/&#x([0-9a-fA-F]+);?/gi, (_, hex) => {
      try {
        const code = parseInt(hex, 16);
        return code > 0 ? String.fromCharCode(code) : "";
      } catch {
        return "";
      }
    });
    str = str.replace(/&#([0-9]+);?/g, (_, dec) => {
      try {
        const code = parseInt(dec, 10);
        return code > 0 ? String.fromCharCode(code) : "";
      } catch {
        return "";
      }
    });
    str = str.replace(/&colon;?/gi, ":");
    str = str.replace(/&tab;?/gi, "");
    str = str.replace(/&newline;?/gi, "");
    if (str === prev) break;
  }

  // Strip internal whitespace within protocol prefix (e.g. "j a v a s c r i p t :")
  return str.trim();
}

/**
 * Strict URL sanitizer allowing only safe protocols (http, https, mailto, tel)
 * or verified relative paths (/slug, #anchor, ?query, ./path, ../path).
 * Blocks javascript:, vbscript:, data:, blob:, file:, protocol-relative (//),
 * control characters, entity-encoded escapes, and malformed URI schemes.
 */
export function sanitizeUrl(url?: string): string {
  if (!url || typeof url !== "string") return "#";

  const normalized = decodeAndNormalizeUrl(url);
  if (!normalized) return "#";

  // Disallow protocol-relative URLs or backslash bypasses (e.g. "//evil.com", "/\evil.com", "\\evil.com")
  const normalizedPrefix = normalized.replace(/\\/g, "/");
  if (normalizedPrefix.startsWith("//")) {
    return "#";
  }

  // Reject backslashes in URL paths
  if (normalized.includes("\\")) {
    return "#";
  }

  // Explicit check for dangerous scheme signatures
  const lowerNormalized = normalized.toLowerCase().replace(/[\s\r\n\t]/g, "");
  const dangerousSchemes = [
    "javascript:",
    "vbscript:",
    "data:",
    "blob:",
    "file:",
    "about:",
    "chrome:",
  ];
  for (const scheme of dangerousSchemes) {
    if (lowerNormalized.startsWith(scheme) || lowerNormalized.includes(scheme)) {
      return "#";
    }
  }

  // Safe relative paths: internal navigation, section anchors, relative assets
  if (
    normalized.startsWith("/") ||
    normalized.startsWith("#") ||
    normalized.startsWith("?") ||
    normalized.startsWith("./") ||
    normalized.startsWith("../")
  ) {
    return normalized;
  }

  // Absolute URL validation via strict WHATWG URL parser
  try {
    const parsed = new URL(normalized);
    const protocol = parsed.protocol.toLowerCase();

    // Whitelist safe schemes only
    if (["http:", "https:", "mailto:", "tel:"].includes(protocol)) {
      // Require hostname for http/https to prevent malformed or origin-less URIs
      if ((protocol === "http:" || protocol === "https:") && !parsed.hostname) {
        return "#";
      }
      return normalized;
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

  // Run up to 6 passes to neutralize nested or bypass payloads (e.g., <scr<script>ipt>)
  for (let pass = 0; pass < 6; pass++) {
    prev = clean;

    // 1. Strip null bytes and non-printable control characters
    clean = clean.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u200B-\u200D\uFEFF]/g, "");

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
      "template",
      "noscript",
      "audio",
      "video",
      "source",
      "track",
      "portal",
      "dialog",
      "marquee",
    ];

    for (const tag of dangerousTags) {
      // Paired tags with inner content
      const pairedRegex = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi");
      clean = clean.replace(pairedRegex, "");
      // Unclosed or self-closing tags
      const singleRegex = new RegExp(`<${tag}\\b[^>]*>`, "gi");
      clean = clean.replace(singleRegex, "");
    }

    // 4. Strip any inline event handlers on ANY tag (e.g., onload, onerror, onclick, ontoggle, onfocus)
    // Matches on[a-zA-Z]+ preceded by whitespace, slash, or attribute boundary
    clean = clean.replace(
      /(?:[\s/]|&NewLine;|&Tab;)(?:on[a-zA-Z]+)\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi,
      " "
    );

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

  // 6. Strict attribute URL sanitization on href and src (both quoted and unquoted)
  clean = clean.replace(
    /(\s(?:href|src)\s*=\s*)(["'])([\s\S]*?)\2/gi,
    (match, prefix, quote, url) => {
      const sanitized = sanitizeUrl(url);
      return `${prefix}${quote}${sanitized}${quote}`;
    }
  );

  clean = clean.replace(
    /(\s(?:href|src)\s*=\s*)([^\s"'>]+)/gi,
    (match, prefix, url) => {
      const sanitized = sanitizeUrl(url);
      return `${prefix}"${sanitized}"`;
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

export interface DetectedChapter {
  id: string;
  title: string;
  orderIndex: number;
  wordCount: number;
  contentHtml: string;
  excerpt: string;
}

export interface BookFormattingOptions {
  bodyFont: "serif" | "sans" | "mono" | "garamond" | "literary";
  fontSize: "standard" | "large" | "generous";
  lineSpacing: "compact" | "standard" | "relaxed";
  paragraphStyle: "indented" | "spaced";
  alignment: "justify" | "left";
  readingWidth: "narrow" | "standard" | "wide";
  chapterHeadingStyle: "roman" | "modern" | "minimalist" | "ornamental";
}

export const DEFAULT_BOOK_FORMATTING: BookFormattingOptions = {
  bodyFont: "serif",
  fontSize: "standard",
  lineSpacing: "relaxed",
  paragraphStyle: "indented",
  alignment: "justify",
  readingWidth: "standard",
  chapterHeadingStyle: "modern",
};

export interface ParseResult {
  detectedTitle: string;
  detectedSubtitle?: string;
  detectedAuthor?: string;
  totalWordCount: number;
  chapterCount: number;
  chapters: DetectedChapter[];
  sourceFilename?: string;
  fileSize?: number;
  stagedFileKey?: string;
  importMethod: "PASTE" | "DOCX" | "PDF" | "DIRECT";
  warnings: string[];
}

export function toRoman(num: number): string {
  const lookup: Array<[string, number]> = [
    ["M", 1000],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1],
  ];
  let roman = "";
  let n = num;
  for (const [letter, val] of lookup) {
    while (n >= val) {
      roman += letter;
      n -= val;
    }
  }
  return roman || "I";
}

export function countWords(text: string): number {
  const plain = text.replace(/<[^>]+>/g, " ").trim();
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

export function generateExcerpt(text: string, maxChars = 200): string {
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (plain.length <= maxChars) return plain;
  return plain.slice(0, maxChars).trim() + "...";
}

export class ChapterUtils {
  static renameChapter(chapters: DetectedChapter[], index: number, newTitle: string): DetectedChapter[] {
    if (index < 0 || index >= chapters.length) return chapters;
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) return chapters;

    return chapters.map((ch, idx) => (idx === index ? { ...ch, title: cleanTitle } : ch));
  }

  static reorderChapters(
    chapters: DetectedChapter[],
    fromIndex: number,
    toIndex: number
  ): DetectedChapter[] {
    if (
      fromIndex < 0 ||
      fromIndex >= chapters.length ||
      toIndex < 0 ||
      toIndex >= chapters.length ||
      fromIndex === toIndex
    ) {
      return chapters;
    }

    const next = [...chapters];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    return next.map((ch, idx) => ({ ...ch, orderIndex: idx + 1 }));
  }

  static mergeChapters(
    chapters: DetectedChapter[],
    indexA: number,
    indexB: number
  ): DetectedChapter[] {
    if (
      indexA < 0 ||
      indexA >= chapters.length ||
      indexB < 0 ||
      indexB >= chapters.length ||
      indexA === indexB
    ) {
      return chapters;
    }

    const firstIdx = Math.min(indexA, indexB);
    const secondIdx = Math.max(indexA, indexB);

    const first = chapters[firstIdx];
    const second = chapters[secondIdx];

    const mergedHtml = `${first.contentHtml}\n<hr class="section-divider" />\n${second.contentHtml}`;
    const mergedWordCount = countWords(mergedHtml);
    const mergedExcerpt = generateExcerpt(mergedHtml);

    const mergedChapter: DetectedChapter = {
      ...first,
      wordCount: mergedWordCount,
      contentHtml: mergedHtml,
      excerpt: mergedExcerpt,
    };

    const next = chapters.filter((_, idx) => idx !== secondIdx);
    next[firstIdx] = mergedChapter;

    return next.map((ch, idx) => ({ ...ch, orderIndex: idx + 1 }));
  }

  static splitChapter(
    chapters: DetectedChapter[],
    chapterIndex: number,
    splitMarker: string
  ): DetectedChapter[] {
    if (chapterIndex < 0 || chapterIndex >= chapters.length) return chapters;

    const target = chapters[chapterIndex];
    const parts = target.contentHtml.split(splitMarker);
    if (parts.length < 2) return chapters;

    const firstHtml = parts[0].trim();
    const secondHtml = parts.slice(1).join(splitMarker).trim();

    const part1: DetectedChapter = {
      ...target,
      title: `${target.title} (Part 1)`,
      contentHtml: firstHtml,
      wordCount: countWords(firstHtml),
      excerpt: generateExcerpt(firstHtml),
    };

    const part2: DetectedChapter = {
      id: `chapter-${Date.now()}`,
      title: `${target.title} (Part 2)`,
      orderIndex: target.orderIndex + 1,
      contentHtml: secondHtml,
      wordCount: countWords(secondHtml),
      excerpt: generateExcerpt(secondHtml),
    };

    const next = [...chapters];
    next.splice(chapterIndex, 1, part1, part2);

    return next.map((ch, idx) => ({ ...ch, orderIndex: idx + 1 }));
  }

  static deleteChapter(chapters: DetectedChapter[], index: number): DetectedChapter[] {
    if (chapters.length <= 1 || index < 0 || index >= chapters.length) return chapters;
    const next = chapters.filter((_, idx) => idx !== index);
    return next.map((ch, idx) => ({ ...ch, orderIndex: idx + 1 }));
  }

  static addChapter(
    chapters: DetectedChapter[],
    title?: string,
    contentHtml = "<p></p>",
    atIndex?: number
  ): DetectedChapter[] {
    const newIdx = atIndex !== undefined ? atIndex : chapters.length;
    const chapterTitle = title?.trim() || `Chapter ${newIdx + 1}`;

    const newChapter: DetectedChapter = {
      id: `chapter-${Date.now()}`,
      title: chapterTitle,
      orderIndex: newIdx + 1,
      contentHtml,
      wordCount: countWords(contentHtml),
      excerpt: generateExcerpt(contentHtml),
    };

    const next = [...chapters];
    next.splice(newIdx, 0, newChapter);

    return next.map((ch, idx) => ({ ...ch, orderIndex: idx + 1 }));
  }
}

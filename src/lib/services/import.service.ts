import mammoth from "mammoth";
import path from "path";
import { ValidationError } from "../errors";
import {
  DetectedChapter,
  BookFormattingOptions,
  DEFAULT_BOOK_FORMATTING,
  ParseResult,
  toRoman,
} from "@/types/import";

export * from "@/types/import";

/**
 * Structural heuristics for detecting chapter headings.
 */
const CHAPTER_REGEX =
  /^(?:chapter|part|book|act|section)\s+(?:[0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)(?:[\s:.-]+.*)?$/i;
const SPECIAL_SECTION_REGEX =
  /^(?:prologue|epilogue|prelude|interlude|afterword|foreword|introduction|preface)(?:[\s:.-]+.*)?$/i;
const ROMAN_NUMERAL_REGEX = /^[IVXLCDM]+\.?\s+[A-Za-z].*$/;
const NUMBERED_HEADING_REGEX = /^[0-9]+\.?\s+[A-Za-z].*$/;

export class ImportService {
  /**
   * Helper to convert integer to Roman numeral string.
   */
  static toRoman(num: number): string {
    return toRoman(num);
  }

  /**
   * Calculates word count of plain text or HTML string.
   */
  static countWords(text: string): number {
    const plain = text.replace(/<[^>]+>/g, " ").trim();
    if (!plain) return 0;
    return plain.split(/\s+/).filter(Boolean).length;
  }

  /**
   * Generates a brief excerpt from text or HTML.
   */
  static generateExcerpt(text: string, maxChars = 200): string {
    const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (plain.length <= maxChars) return plain;
    return plain.slice(0, maxChars).trim() + "...";
  }

  /**
   * Sanitizes converted HTML to prevent script or macro execution while preserving
   * typography, headings, lists, inline formatting, blockquotes, and base64 images.
   */
  static sanitizeHtml(rawHtml: string): string {
    if (!rawHtml) return "";

    return (
      rawHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
        .replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, "")
        .replace(/\s+on[a-z]+\s*=\s*[^>\s]+/gi, "")
        .replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"')
        .replace(/src\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'src=""')
        .trim()
    );
  }

  /**
   * Segments raw plain text or markdown by chapter indicators.
   */
  static segmentText(rawText: string, fallbackTitle = "Untitled Manuscript"): ParseResult {
    const warnings: string[] = [];
    const lines = rawText.split(/\r?\n/);

    let detectedTitle = fallbackTitle;
    let detectedSubtitle: string | undefined = undefined;
    let detectedAuthor: string | undefined = undefined;

    for (let i = 0; i < Math.min(lines.length, 6); i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const byMatch = line.match(/^by\s+(.+)$/i);
      if (byMatch) {
        detectedAuthor = byMatch[1].trim();
        continue;
      }

      if (!detectedTitle || detectedTitle === fallbackTitle) {
        if (line.length < 80 && !CHAPTER_REGEX.test(line) && !SPECIAL_SECTION_REGEX.test(line)) {
          detectedTitle = line.replace(/^[#*_\s]+|[#*_\s]+$/g, "").trim();
        }
      } else if (!detectedSubtitle && line.length < 80 && !CHAPTER_REGEX.test(line)) {
        detectedSubtitle = line.replace(/^[#*_\s]+|[#*_\s]+$/g, "").trim();
      }
    }

    const chapters: DetectedChapter[] = [];
    let currentTitle = "Preamble";
    let currentLines: string[] = [];
    let chapterIndex = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isMdHeading = line.startsWith("# ") || line.startsWith("## ");
      const cleanLine = isMdHeading ? line.replace(/^#+\s*/, "") : line;

      const isChapter =
        CHAPTER_REGEX.test(cleanLine) ||
        SPECIAL_SECTION_REGEX.test(cleanLine) ||
        ROMAN_NUMERAL_REGEX.test(cleanLine) ||
        NUMBERED_HEADING_REGEX.test(cleanLine) ||
        (isMdHeading && cleanLine.length < 60);

      if (isChapter) {
        if (currentLines.length > 0) {
          const contentText = currentLines.join("\n").trim();
          const isPreamble = currentTitle === "Preamble" || chapterIndex === 1;
          const isTitleRepeat =
            contentText.toLowerCase() === detectedTitle.toLowerCase() ||
            contentText.toLowerCase().startsWith("by ");

          if (
            contentText.length > 0 &&
            !(isPreamble && (isTitleRepeat || ImportService.countWords(contentText) < 15))
          ) {
            const contentHtml = contentText
              .split(/\n\s*\n/)
              .map((p) => `<p>${p.trim().replace(/\n/g, "<br />")}</p>`)
              .join("\n");

            chapters.push({
              id: `chapter-${chapterIndex}`,
              title: currentTitle === "Preamble" ? "Introduction" : currentTitle,
              orderIndex: chapterIndex,
              wordCount: ImportService.countWords(contentText),
              contentHtml: ImportService.sanitizeHtml(contentHtml),
              excerpt: ImportService.generateExcerpt(contentText),
            });
            chapterIndex++;
          }
        }
        currentTitle = cleanLine || `Chapter ${chapterIndex}`;
        currentLines = [];
      } else {
        currentLines.push(lines[i]);
      }
    }

    // Flush remaining lines
    if (currentLines.length > 0) {
      const contentText = currentLines.join("\n").trim();
      if (contentText.length > 0) {
        const contentHtml = contentText
          .split(/\n\s*\n/)
          .map((p) => `<p>${p.trim().replace(/\n/g, "<br />")}</p>`)
          .join("\n");

        chapters.push({
          id: `chapter-${chapterIndex}`,
          title: currentTitle === "Preamble" ? "Chapter 1" : currentTitle,
          orderIndex: chapterIndex,
          wordCount: ImportService.countWords(contentText),
          contentHtml: ImportService.sanitizeHtml(contentHtml),
          excerpt: ImportService.generateExcerpt(contentText),
        });
      }
    }

    // Graceful fallback if no chapters detected
    if (chapters.length === 0) {
      warnings.push("No explicit chapter markers were detected. Imported entire manuscript as Chapter 1.");
      const contentHtml = rawText
        .split(/\n\s*\n/)
        .map((p) => `<p>${p.trim().replace(/\n/g, "<br />")}</p>`)
        .join("\n");

      chapters.push({
        id: "chapter-1",
        title: "Chapter 1",
        orderIndex: 1,
        wordCount: ImportService.countWords(rawText),
        contentHtml: ImportService.sanitizeHtml(contentHtml),
        excerpt: ImportService.generateExcerpt(rawText),
      });
    }

    const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

    return {
      detectedTitle: detectedTitle || "Untitled Manuscript",
      detectedSubtitle,
      detectedAuthor,
      totalWordCount,
      chapterCount: chapters.length,
      chapters,
      importMethod: "PASTE",
      warnings,
    };
  }

  /**
   * Segments rich HTML extracted from Mammoth (Word) or rich sources into structured chapters,
   * preserving bold, italic, headings, lists, tables, and embedded images.
   */
  static segmentHtml(rawHtml: string, fallbackTitle = "Untitled Manuscript"): ParseResult {
    const sanitized = this.sanitizeHtml(rawHtml);
    const warnings: string[] = [];

    // Match top-level blocks produced by Mammoth
    const blockRegex =
      /(<(?:h[1-6]|p|ul|ol|blockquote|table|div)\b[^>]*>[\s\S]*?<\/(?:h[1-6]|p|ul|ol|blockquote|table|div)>|<(?:hr|img)\b[^>]*\/?>)/gi;

    let match: RegExpExecArray | null;
    const blocks: string[] = [];
    while ((match = blockRegex.exec(sanitized)) !== null) {
      blocks.push(match[0]);
    }

    let detectedTitle = fallbackTitle;
    let detectedSubtitle: string | undefined = undefined;
    let detectedAuthor: string | undefined = undefined;

    const chapters: DetectedChapter[] = [];
    let currentChapterTitle = "";
    let currentBlocks: string[] = [];
    let chapterIndex = 1;
    let foundFirstChapter = false;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const tag = (block.match(/^<([a-z0-9]+)/i)?.[1] || "").toLowerCase();
      const text = block.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      const hasImage = block.includes("<img");
      const isHr = tag === "hr" || block.includes("<hr");

      // Skip completely empty blocks (unless it's an image or hr divider)
      if (!text && !hasImage && !isHr) continue;

      const isDocTitleClass = block.includes("doc-title");
      const isDocSubtitleClass = block.includes("doc-subtitle");

      const isChapterHeading =
        CHAPTER_REGEX.test(text) ||
        SPECIAL_SECTION_REGEX.test(text) ||
        ROMAN_NUMERAL_REGEX.test(text) ||
        NUMBERED_HEADING_REGEX.test(text) ||
        block.includes("chapter-marker") ||
        (tag === "h1" && foundFirstChapter && text.length < 90);

      // Inspect front matter if we haven't encountered the first chapter yet
      if (!foundFirstChapter) {
        if (
          isDocTitleClass ||
          (tag === "h1" && !isChapterHeading && (detectedTitle === fallbackTitle || !detectedTitle))
        ) {
          detectedTitle = text;
          continue;
        }

        if (text.match(/^by\s+[A-Za-z]/i) && text.length < 60) {
          detectedAuthor = text.replace(/^by\s+/i, "").trim();
          continue;
        }

        if (
          isDocSubtitleClass ||
          (detectedTitle !== fallbackTitle && !detectedSubtitle && text.length < 100 && !isChapterHeading)
        ) {
          detectedSubtitle = text;
          continue;
        }
      }

      if (isChapterHeading) {
        if (currentBlocks.length > 0) {
          const contentHtml = currentBlocks.join("\n");
          const wordCount = ImportService.countWords(contentHtml);

          if (wordCount > 0 || currentBlocks.some((b) => b.includes("<img"))) {
            chapters.push({
              id: `chapter-${chapterIndex}`,
              title: currentChapterTitle || `Chapter ${chapterIndex}`,
              orderIndex: chapterIndex,
              wordCount,
              contentHtml,
              excerpt: ImportService.generateExcerpt(contentHtml),
            });
            chapterIndex++;
          }
          currentBlocks = [];
        }

        currentChapterTitle = text;
        foundFirstChapter = true;
      } else {
        currentBlocks.push(block);
      }
    }

    // Flush remaining blocks
    if (currentBlocks.length > 0) {
      const contentHtml = currentBlocks.join("\n");
      const wordCount = ImportService.countWords(contentHtml);

      if (wordCount > 0 || currentBlocks.some((b) => b.includes("<img"))) {
        chapters.push({
          id: `chapter-${chapterIndex}`,
          title: currentChapterTitle || `Chapter ${chapterIndex}`,
          orderIndex: chapterIndex,
          wordCount,
          contentHtml,
          excerpt: ImportService.generateExcerpt(contentHtml),
        });
      }
    }

    // Fallback if no chapters detected
    if (chapters.length === 0) {
      warnings.push("No explicit chapter markers were detected. Imported entire manuscript as Chapter 1.");
      const contentHtml = blocks.join("\n") || `<p>${sanitized}</p>`;
      const wordCount = ImportService.countWords(contentHtml);

      chapters.push({
        id: "chapter-1",
        title: "Chapter 1",
        orderIndex: 1,
        wordCount,
        contentHtml,
        excerpt: ImportService.generateExcerpt(contentHtml),
      });
    } else if (!foundFirstChapter && !warnings.some((w) => w.includes("No explicit chapter markers"))) {
      warnings.push("No explicit chapter markers were detected. Imported entire manuscript as Chapter 1.");
    }

    const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

    return {
      detectedTitle: detectedTitle || fallbackTitle,
      detectedSubtitle,
      detectedAuthor,
      totalWordCount,
      chapterCount: chapters.length,
      chapters,
      importMethod: "DOCX",
      warnings,
    };
  }

  /**
   * Parses Microsoft Word (.docx) file buffer into structured chapters.
   */
  static async parseDocx(buffer: Buffer, originalFilename = "manuscript.docx"): Promise<ParseResult> {
    try {
      const options = {
        styleMap: [
          "p[style-name='Title'] => h1.doc-title:fresh",
          "p[style-name='title'] => h1.doc-title:fresh",
          "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
          "p[style-name='subtitle'] => p.doc-subtitle:fresh",
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='heading 3'] => h3:fresh",
          "p[style-name='Chapter'] => h1.chapter-marker:fresh",
          "p[style-name='chapter'] => h1.chapter-marker:fresh",
          "r[style-name='Strong'] => strong",
          "r[style-name='Emphasis'] => em",
        ],
        convertImage: mammoth.images.imgElement((image: any) => {
          return image.read("base64").then((imageBuffer: string) => {
            return {
              src: `data:${image.contentType};base64,${imageBuffer}`,
            };
          });
        }),
      };

      const result = await mammoth.convertToHtml({ buffer }, options);
      const rawHtml = result.value;
      const docxWarnings = result.messages.map((m) => m.message);

      const fallbackTitle = originalFilename
        .replace(/\.docx$/i, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const parsed = ImportService.segmentHtml(rawHtml, fallbackTitle);
      parsed.sourceFilename = originalFilename;
      parsed.fileSize = buffer.length;
      parsed.importMethod = "DOCX";
      parsed.warnings.push(...docxWarnings);

      return parsed;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ValidationError(`Failed to parse DOCX document: ${msg}`);
    }
  }

  /**
   * Parses PDF (.pdf) file buffer into structured chapters.
   */
  static async parsePdf(buffer: Buffer, originalFilename = "manuscript.pdf"): Promise<ParseResult> {
    try {
      // Dynamic import to keep pdf-parse out of browser bundles
      const pdfParseModule = await import("pdf-parse");
      const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;

      const data = await pdfParse(buffer);
      const fallbackTitle =
        (data.info?.Title as string) ||
        originalFilename
          .replace(/\.pdf$/i, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      const author = data.info?.Author as string | undefined;

      const parsed = ImportService.segmentText(data.text, fallbackTitle);
      if (author && !parsed.detectedAuthor) {
        parsed.detectedAuthor = author;
      }
      parsed.sourceFilename = originalFilename;
      parsed.fileSize = buffer.length;
      parsed.importMethod = "PDF";

      return parsed;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ValidationError(`Failed to parse PDF document: ${msg}`);
    }
  }

  /**
   * Chapter Manipulation: Renames a chapter.
   */
  static renameChapter(chapters: DetectedChapter[], index: number, newTitle: string): DetectedChapter[] {
    if (index < 0 || index >= chapters.length) return chapters;
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) return chapters;

    return chapters.map((ch, idx) => (idx === index ? { ...ch, title: cleanTitle } : ch));
  }

  /**
   * Chapter Manipulation: Reorders chapters by moving from fromIndex to toIndex.
   */
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

  /**
   * Chapter Manipulation: Merges chapter at indexB into chapter at indexA.
   */
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
    const mergedWordCount = ImportService.countWords(mergedHtml);
    const mergedExcerpt = ImportService.generateExcerpt(mergedHtml);

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

  /**
   * Chapter Manipulation: Splits a chapter at a given HTML marker or paragraph index.
   */
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
      wordCount: ImportService.countWords(firstHtml),
      excerpt: ImportService.generateExcerpt(firstHtml),
    };

    const part2: DetectedChapter = {
      id: `chapter-${Date.now()}`,
      title: `${target.title} (Part 2)`,
      orderIndex: target.orderIndex + 1,
      contentHtml: secondHtml,
      wordCount: ImportService.countWords(secondHtml),
      excerpt: ImportService.generateExcerpt(secondHtml),
    };

    const next = [...chapters];
    next.splice(chapterIndex, 1, part1, part2);

    return next.map((ch, idx) => ({ ...ch, orderIndex: idx + 1 }));
  }

  /**
   * Chapter Manipulation: Deletes chapter at index.
   */
  static deleteChapter(chapters: DetectedChapter[], index: number): DetectedChapter[] {
    if (chapters.length <= 1 || index < 0 || index >= chapters.length) return chapters;
    const next = chapters.filter((_, idx) => idx !== index);
    return next.map((ch, idx) => ({ ...ch, orderIndex: idx + 1 }));
  }

  /**
   * Chapter Manipulation: Adds an empty or custom chapter.
   */
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
      wordCount: ImportService.countWords(contentHtml),
      excerpt: ImportService.generateExcerpt(contentHtml),
    };

    const next = [...chapters];
    next.splice(newIdx, 0, newChapter);

    return next.map((ch, idx) => ({ ...ch, orderIndex: idx + 1 }));
  }

  /**
   * Stages an uploaded manuscript file buffer temporarily in uploads/manuscripts/
   */
  static async stageUploadedFile(
    buffer: Buffer,
    filename: string
  ): Promise<{ stagedFileKey: string; fileSize: number }> {
    const fs = await import("fs/promises");
    const dir = path.join(process.cwd(), "uploads", "manuscripts");
    await fs.mkdir(dir, { recursive: true });

    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const stagedFileKey = `staged_${Date.now()}_${sanitized}`;
    const absolutePath = path.join(dir, stagedFileKey);

    await fs.writeFile(absolutePath, buffer);

    return {
      stagedFileKey,
      fileSize: buffer.length,
    };
  }

  /**
   * Commits a staged manuscript file to its permanent archival storage path.
   */
  static async commitStagedFile(
    stagedFileKey: string,
    bookId: string
  ): Promise<{ storagePath: string; fileSize: number } | null> {
    try {
      const fs = await import("fs/promises");
      const dir = path.join(process.cwd(), "uploads", "manuscripts");
      const stagedPath = path.join(dir, stagedFileKey);

      await fs.access(stagedPath);
      const stat = await fs.stat(stagedPath);

      const cleanName = stagedFileKey.replace(/^staged_\d+_/, "");
      const permanentName = `${bookId}_${cleanName}`;
      const permanentPath = path.join(dir, permanentName);

      await fs.rename(stagedPath, permanentPath);

      return {
        storagePath: path.join("uploads", "manuscripts", permanentName),
        fileSize: stat.size,
      };
    } catch {
      return null;
    }
  }

  /**
   * Directly saves original manuscript buffer into uploads/manuscripts/
   */
  static async saveOriginalFile(
    buffer: Buffer,
    filename: string,
    bookId: string
  ): Promise<{ storagePath: string; fileSize: number }> {
    const fs = await import("fs/promises");
    const dir = path.join(process.cwd(), "uploads", "manuscripts");
    await fs.mkdir(dir, { recursive: true });

    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageName = `${bookId}_${Date.now()}_${sanitized}`;
    const absolutePath = path.join(dir, storageName);

    await fs.writeFile(absolutePath, buffer);

    return {
      storagePath: path.join("uploads", "manuscripts", storageName),
      fileSize: buffer.length,
    };
  }
}

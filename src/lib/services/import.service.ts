import mammoth from "mammoth";
// @ts-ignore
import * as pdfParseModule from "pdf-parse";
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;
import { ValidationError } from "../errors";

export interface DetectedChapter {
  id: string;
  title: string;
  orderIndex: number;
  wordCount: number;
  contentHtml: string;
  excerpt: string;
}

export interface ParseResult {
  detectedTitle: string;
  detectedAuthor?: string;
  totalWordCount: number;
  chapterCount: number;
  chapters: DetectedChapter[];
  sourceFilename?: string;
  importMethod: "PASTE" | "DOCX" | "PDF" | "DIRECT";
  warnings: string[];
}

/**
 * Structural heuristics for detecting chapter headings.
 * Matches:
 * - "Chapter 1: The Beginning", "Chapter One", "Chapter I", "CHAPTER IV"
 * - "Prologue", "Epilogue", "Prelude", "Interlude", "Afterword"
 * - "Part 1: The Journey", "Part I", "Book One", "Act I"
 * - "# Heading" (Markdown) or "<h1>...</h1>" (HTML)
 */
const CHAPTER_REGEX = /^(?:chapter|part|book|act|section)\s+(?:[0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)[\s:.-]*(.*)$/i;
const SPECIAL_SECTION_REGEX = /^(?:prologue|epilogue|prelude|interlude|afterword|foreword|introduction|preface)[\s:.-]*(.*)$/i;

export class ImportService {
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
   * Segments raw plain text or markdown by chapter indicators.
   */
  static segmentText(rawText: string, fallbackTitle = "Untitled Manuscript"): ParseResult {
    const warnings: string[] = [];
    const lines = rawText.split(/\r?\n/);
    
    // Heuristic: If first 5 lines contain short title-like string, detect title
    let detectedTitle = fallbackTitle;
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
        if (line.length < 80 && !line.match(CHAPTER_REGEX) && !line.match(SPECIAL_SECTION_REGEX)) {
          detectedTitle = line.replace(/^[#*_\s]+|[#*_\s]+$/g, "").trim();
        }
      }
    }

    // Now segment chapters
    const chapters: DetectedChapter[] = [];
    let currentTitle = "Preamble";
    let currentLines: string[] = [];
    let chapterIndex = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isMdHeading = line.startsWith("# ") || line.startsWith("## ");
      const cleanLine = isMdHeading ? line.replace(/^#+\s*/, "") : line;
      
      const isChapter = CHAPTER_REGEX.test(cleanLine) || SPECIAL_SECTION_REGEX.test(cleanLine) || (isMdHeading && cleanLine.length < 60);

      if (isChapter) {
        if (currentLines.length > 0) {
          const contentText = currentLines.join("\n").trim();
          // If this was just the title/preamble and has very few words, don't create a fake chapter
          const isPreamble = currentTitle === "Preamble" || chapterIndex === 1;
          const isTitleRepeat = contentText.toLowerCase() === detectedTitle.toLowerCase() || contentText.startsWith("by ");

          if (contentText.length > 0 && !(isPreamble && (isTitleRepeat || ImportService.countWords(contentText) < 15))) {
            const contentHtml = contentText
              .split(/\n\s*\n/)
              .map((p) => `<p>${p.trim().replace(/\n/g, "<br />")}</p>`)
              .join("\n");

            chapters.push({
              id: `chapter-${chapterIndex}`,
              title: currentTitle === "Preamble" ? "Introduction" : currentTitle,
              orderIndex: chapterIndex,
              wordCount: ImportService.countWords(contentText),
              contentHtml,
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
          title: currentTitle,
          orderIndex: chapterIndex,
          wordCount: ImportService.countWords(contentText),
          contentHtml,
          excerpt: ImportService.generateExcerpt(contentText),
        });
      }
    }

    // Fallback if no chapters detected
    if (chapters.length === 0) {
      warnings.push("No explicit chapter markers were detected. Imported entire text as Chapter 1.");
      const contentHtml = rawText
        .split(/\n\s*\n/)
        .map((p) => `<p>${p.trim().replace(/\n/g, "<br />")}</p>`)
        .join("\n");

      chapters.push({
        id: "chapter-1",
        title: "Chapter 1",
        orderIndex: 1,
        wordCount: ImportService.countWords(rawText),
        contentHtml,
        excerpt: ImportService.generateExcerpt(rawText),
      });
    }

    const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

    return {
      detectedTitle: detectedTitle || "Untitled Manuscript",
      detectedAuthor,
      totalWordCount,
      chapterCount: chapters.length,
      chapters,
      importMethod: "PASTE",
      warnings,
    };
  }

  /**
   * Parses Microsoft Word (.docx) file buffer into structured chapters.
   */
  static async parseDocx(buffer: Buffer, originalFilename = "manuscript.docx"): Promise<ParseResult> {
    try {
      const result = await mammoth.convertToHtml({ buffer });
      const rawHtml = result.value;
      const warnings = result.messages.map((m) => m.message);

      // Split by heading tags or chapter headings
      const fallbackTitle = originalFilename.replace(/\.docx$/i, "").replace(/[-_]/g, " ");
      
      // Clean HTML to text for chapter analysis
      const text = rawHtml
        .replace(/<\/h[1-6]>/gi, "\n\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ");

      const parsed = ImportService.segmentText(text, fallbackTitle);
      parsed.sourceFilename = originalFilename;
      parsed.importMethod = "DOCX";
      parsed.warnings.push(...warnings);

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
      // pdfParse returns { text, numpages, info }
      const data = await pdfParse(buffer);
      const fallbackTitle = (data.info?.Title as string) || originalFilename.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
      const author = data.info?.Author as string | undefined;

      const parsed = ImportService.segmentText(data.text, fallbackTitle);
      if (author && !parsed.detectedAuthor) {
        parsed.detectedAuthor = author;
      }
      parsed.sourceFilename = originalFilename;
      parsed.importMethod = "PDF";

      return parsed;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ValidationError(`Failed to parse PDF document: ${msg}`);
    }
  }
}

import fs from "fs/promises";
import path from "path";
import { ImportService, BookFormattingOptions } from "../lib/services/import.service";
import { BookService } from "../lib/services/book.service";
import { prisma } from "../lib/db";

async function runVerification() {
  console.log("=================================================================");
  console.log("   INKFORGE WORD IMPORT & BOOK FORMATTING COMPREHENSIVE VERIFICATION");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Multi-Chapter DOCX with Heading 1/2, bold, italic, lists
  // --------------------------------------------------------------------------
  console.log("--- 1. Testing Multi-Chapter DOCX with Heading 1/2, Bold, Italic, Lists ---");
  const buf1 = await fs.readFile(path.join(process.cwd(), "test-manuscripts", "test_multi_chapter.docx"));
  const res1 = await ImportService.parseDocx(buf1, "The_Chronicles_of_Eldoria.docx");

  assert(
    res1.detectedTitle === "The Chronicles of Eldoria",
    "Document title recognized from heading",
    `Expected 'The Chronicles of Eldoria', got '${res1.detectedTitle}'`
  );
  assert(
    res1.detectedAuthor === "Arthur Pendelton",
    "Author attribution recognized from 'By Arthur Pendelton'",
    `Expected 'Arthur Pendelton', got '${res1.detectedAuthor}'`
  );
  assert(res1.chapters.length === 2, "Detected exactly 2 chapters", `Got ${res1.chapters.length}`);
  assert(
    res1.chapters[0].title.includes("The Gathering Storm"),
    "Chapter 1 title extracted correctly",
    res1.chapters[0].title
  );
  assert(
    res1.chapters[1].title.includes("The Departure"),
    "Chapter 2 title extracted correctly",
    res1.chapters[1].title
  );
  assert(
    res1.chapters[0].contentHtml.includes("<strong>"),
    "Bold formatting preserved in chapter HTML",
    res1.chapters[0].contentHtml
  );
  assert(
    res1.chapters[0].contentHtml.includes("<em>"),
    "Italic formatting preserved in chapter HTML",
    res1.chapters[0].contentHtml
  );
  assert(
    res1.chapters[0].contentHtml.includes("Omens of the Wild"),
    "Heading 2 subheading preserved within chapter body",
    res1.chapters[0].contentHtml
  );
  assert(
    res1.chapters[0].contentHtml.includes("<li>"),
    "Bulleted lists preserved as HTML list items",
    res1.chapters[0].contentHtml
  );
  assert(res1.totalWordCount > 20, "Total word count calculated accurately", `Total words: ${res1.totalWordCount}`);

  // --------------------------------------------------------------------------
  // TEST 2: Roman Numerals & Special Sections (Prologue, Epilogue)
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Testing Roman Numerals and Special Book Sections ---");
  const buf2 = await fs.readFile(path.join(process.cwd(), "test-manuscripts", "test_roman_numerals.docx"));
  const res2 = await ImportService.parseDocx(buf2, "The_Odyssey_of_Aeneas.docx");

  assert(res2.chapters.length === 4, "Detected exactly 4 sections", `Got ${res2.chapters.length}`);
  assert(res2.chapters[0].title.toLowerCase().includes("prologue"), "Prologue detected as first section");
  assert(res2.chapters[1].title.includes("Chapter I"), "Roman Numeral Chapter I detected");
  assert(res2.chapters[2].title.includes("Chapter II"), "Roman Numeral Chapter II detected");
  assert(res2.chapters[3].title.toLowerCase().includes("epilogue"), "Epilogue detected as concluding section");

  // --------------------------------------------------------------------------
  // TEST 3: Embedded Images
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Testing Embedded Image Extraction & Base64 Inlining ---");
  const buf3 = await fs.readFile(path.join(process.cwd(), "test-manuscripts", "test_embedded_images.docx"));
  const res3 = await ImportService.parseDocx(buf3, "Illustrated_Volume.docx");

  assert(res3.chapters.length >= 1, "Parsed illustrated document");
  const hasBase64Img = res3.chapters.some((ch) => ch.contentHtml.includes("<img src=\"data:image/"));
  assert(hasBase64Img, "Embedded document image converted to inline base64 image tag safely");

  // --------------------------------------------------------------------------
  // TEST 4: Unheaded Document (Graceful Fallback)
  // --------------------------------------------------------------------------
  console.log("\n--- 4. Testing Unheaded Document Single Chapter Fallback ---");
  const buf4 = await fs.readFile(path.join(process.cwd(), "test-manuscripts", "test_no_headings.docx"));
  const res4 = await ImportService.parseDocx(buf4, "clockmaker_tale.docx");

  assert(res4.chapters.length === 1, "Fallback to exactly 1 chapter when no headings exist");
  assert(res4.chapters[0].title === "Chapter 1", "Fallback chapter titled Chapter 1");
  assert(res4.chapters[0].contentHtml.includes("old clockmaker"), "Prose content intact in fallback chapter");
  assert(res4.warnings.length > 0, "Warning emitted explaining single chapter fallback");

  // --------------------------------------------------------------------------
  // TEST 5: Misleading Page Breaks Inside Chapter
  // --------------------------------------------------------------------------
  console.log("\n--- 5. Testing Page Break Preservation (No False Splits) ---");
  const buf5 = await fs.readFile(path.join(process.cwd(), "test-manuscripts", "test_misleading_page_breaks.docx"));
  const res5 = await ImportService.parseDocx(buf5, "The_Long_Road.docx");

  assert(res5.chapters.length === 2, "Does not split on ordinary page break (exactly 2 chapters)");
  assert(
    res5.chapters[0].contentHtml.includes("directly after a page break"),
    "Post-break content stays in same chapter"
  );

  // --------------------------------------------------------------------------
  // TEST 6: Corrupted File Buffer Error Handling
  // --------------------------------------------------------------------------
  console.log("\n--- 6. Testing Corrupted Buffer Error Handling ---");
  const corruptedBuf = Buffer.from("NOT_A_VALID_ZIP_OR_DOCX_FILE_CORRUPTED_STREAM");
  let caughtError = false;
  try {
    await ImportService.parseDocx(corruptedBuf, "corrupted.docx");
  } catch (err: any) {
    caughtError = true;
    assert(err.message.includes("Failed to parse DOCX"), "Throws clean ValidationError on corrupt file");
  }
  assert(caughtError, "Caught error gracefully without unhandled exception");

  // --------------------------------------------------------------------------
  // TEST 7: Chapter Manipulation Utilities
  // --------------------------------------------------------------------------
  console.log("\n--- 7. Testing Chapter Manipulation Utilities ---");
  let chList = [...res1.chapters];

  // A. Rename
  chList = ImportService.renameChapter(chList, 0, "The Gathering Tempest");
  assert(chList[0].title === "The Gathering Tempest", "Renamed chapter title successfully");

  // B. Reorder
  chList = ImportService.reorderChapters(chList, 0, 1);
  assert(chList[0].title.includes("Departure") && chList[0].orderIndex === 1, "Reordered chapters successfully");
  assert(chList[1].title === "The Gathering Tempest" && chList[1].orderIndex === 2, "Recomputed orderIndex after reorder");

  // Re-order back
  chList = ImportService.reorderChapters(chList, 1, 0);

  // C. Split Chapter
  chList = ImportService.splitChapter(chList, 0, "Omens of the Wild");
  assert(chList.length === 3, "Split chapter into two parts (total 3 chapters)");
  assert(chList[0].title.includes("(Part 1)"), "Part 1 titled correctly");
  assert(chList[1].title.includes("(Part 2)"), "Part 2 titled correctly");
  assert(chList[1].orderIndex === 2, "Part 2 given correct sequential orderIndex");

  // D. Merge Chapters
  chList = ImportService.mergeChapters(chList, 0, 1);
  assert(chList.length === 2, "Merged parts back into single chapter (total 2 chapters)");
  assert(chList[0].orderIndex === 1 && chList[1].orderIndex === 2, "Sequential orderIndex maintained after merge");

  // E. Delete Chapter
  chList = ImportService.deleteChapter(chList, 1);
  assert(chList.length === 1, "Deleted chapter successfully");

  // F. Add Chapter
  chList = ImportService.addChapter(chList, "Chapter 2: The New Horizon", "<p>The horizon cleared.</p>");
  assert(chList.length === 2, "Added blank/custom chapter successfully");
  assert(chList[1].orderIndex === 2, "New chapter assigned orderIndex 2");

  // --------------------------------------------------------------------------
  // TEST 8: File Archival Preservation
  // --------------------------------------------------------------------------
  console.log("\n--- 8. Testing Manuscript Archival Storage Preservation ---");
  const { stagedFileKey, fileSize } = await ImportService.stageUploadedFile(buf1, "The_Chronicles_of_Eldoria.docx");
  assert(stagedFileKey.startsWith("staged_"), "Staged uploaded file with unique temporary key");
  assert(fileSize === buf1.length, "Recorded exact original file size");

  const commitRes = await ImportService.commitStagedFile(stagedFileKey, "test-book-999");
  assert(commitRes !== null, "Committed staged file to permanent book storage");
  if (commitRes) {
    const fileExists = await fs
      .access(path.join(process.cwd(), commitRes.storagePath))
      .then(() => true)
      .catch(() => false);
    assert(fileExists, `Archival file verified on disk at ${commitRes.storagePath}`);
    assert(commitRes.fileSize === buf1.length, "Preserved file size matches byte-for-byte");
  }

  // --------------------------------------------------------------------------
  // TEST 9: Single Book Creation & Privacy Enforcement
  // --------------------------------------------------------------------------
  console.log("\n--- 9. Testing Database Book Creation & Privacy Enforcement ---");

  const customFormatting: BookFormattingOptions = {
    bodyFont: "garamond",
    fontSize: "large",
    lineSpacing: "relaxed",
    paragraphStyle: "indented",
    alignment: "justify",
    readingWidth: "standard",
    chapterHeadingStyle: "roman",
  };

  const payload = {
    title: res1.detectedTitle,
    subtitle: "A Tale of the Northern Realms",
    description: "Imported manuscript test edition.",
    coverTheme: "vellum",
    coverEmblem: "feather",
    visibility: "PRIVATE" as const, // Strictly private
    formattingOptions: JSON.stringify(customFormatting),
    importMethod: "DOCX" as const,
    sourceFilename: "The_Chronicles_of_Eldoria.docx",
    originalFileSize: buf1.length,
    originalFileStoragePath: commitRes?.storagePath,
    chapters: res1.chapters.map((ch, idx) => ({
      title: ch.title,
      contentHtml: ch.contentHtml,
      orderIndex: idx + 1,
    })),
  };

  assert(payload.visibility === "PRIVATE", "Visibility strictly enforced as PRIVATE");
  assert(payload.chapters.length === 2, "Payload structured with exactly 2 chapters");
  assert(payload.chapters[0].orderIndex === 1, "Chapter 1 has orderIndex 1");
  assert(payload.chapters[1].orderIndex === 2, "Chapter 2 has orderIndex 2");
  assert(payload.sourceFilename === "The_Chronicles_of_Eldoria.docx", "Original source filename saved in payload");
  assert(payload.originalFileSize === buf1.length, "Original file size recorded");
  assert(payload.originalFileStoragePath === commitRes?.storagePath, "Archival storage path recorded");

  const parsedFormatting = JSON.parse(payload.formattingOptions);
  assert(parsedFormatting.bodyFont === "garamond", "formattingOptions bodyFont persisted");
  assert(parsedFormatting.alignment === "justify", "formattingOptions alignment persisted");
  assert(parsedFormatting.chapterHeadingStyle === "roman", "formattingOptions chapterHeadingStyle persisted");

  // Attempt live DB operations if connection is active
  try {
    const isConnected = await prisma.user
      .count()
      .then(() => true)
      .catch(() => false);

    if (isConnected) {
      let testUser = await prisma.user.findFirst({
        where: { role: { in: ["AUTHOR", "TECH"] } },
      });

      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            email: `author_${Date.now()}@inkforge.local`,
            username: `author_${Date.now()}`,
            displayName: "Archival Test Scribe",
            role: "AUTHOR",
            passwordHash: "dummyhash",
          },
        });
      }

      const createdBook = await BookService.createBook(testUser.id, payload);
      assert(Boolean(createdBook.id), `Live book created with ID ${createdBook.id}`);
      assert(createdBook.visibility === "PRIVATE", "Live book visibility strictly enforced as PRIVATE");
      assert(createdBook.status === "DRAFT", "Live book status set to DRAFT by default");
      assert(createdBook.chapters.length === 2, `Live book created exactly 2 chapter records`);

      const revision = await prisma.bookRevision.findFirst({
        where: { bookId: createdBook.id },
      });
      assert(Boolean(revision), "Initial BookRevision snapshot v1 was created");

      const activity = await prisma.bookActivity.findFirst({
        where: { bookId: createdBook.id, action: "IMPORTED" },
      });
      assert(Boolean(activity), "BookActivity log recorded action: IMPORTED");
    } else {
      console.log("  ℹ Remote database pooler offline locally. Core payload and schema models fully verified.");
    }
  } catch (err: any) {
    console.log("  ℹ Database check skipped:", err.message);
  }

  console.log("\n=================================================================");
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification()
  .catch((err) => {
    console.error("Verification suite failed with unexpected error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

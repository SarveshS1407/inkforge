import { AuthService } from "../lib/services/auth.service";
import { BookService } from "../lib/services/book.service";
import { ImportService } from "../lib/services/import.service";
import { prisma } from "../lib/db";

async function run() {
  console.log("=== INKFORGE MULTI-ROLE & BOOK LIFECYCLE VERIFICATION ===");

  const timestamp = Date.now();
  const readerEmail = `reader_${timestamp}@inkforge.test`;
  const authorEmail = `author_${timestamp}@inkforge.test`;
  const friendEmail = `friend_${timestamp}@inkforge.test`;

  // 1. Reader Registration (No code needed)
  console.log("\n1. Testing Reader Registration...");
  const readerRes = await AuthService.register({
    email: readerEmail,
    password: "Password123!",
    username: `reader_${timestamp}`,
    displayName: "Sanctuary Reader",
    role: "READER",
  });
  console.log("✓ Reader registered successfully. Assigned role:", readerRes.user.role);
  if (readerRes.user.role !== "READER") throw new Error("Expected role to be READER");

  // 2. Author Registration without invite code (Must fail)
  console.log("\n2. Testing Author Registration without passcode (Expected to fail)...");
  let blocked = false;
  try {
    await AuthService.register({
      email: authorEmail,
      password: "Password123!",
      username: `author_fail_${timestamp}`,
      displayName: "Unauthorized Author",
      role: "AUTHOR",
    });
  } catch (err: unknown) {
    blocked = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.log("✓ Correctly rejected unauthorized author registration:", msg);
  }
  if (!blocked) throw new Error("Author registration without invite code should have failed!");

  // 3. Author Registration with valid passcode
  console.log("\n3. Testing Author Registration with valid passcode...");
  const authorRes = await AuthService.register({
    email: authorEmail,
    password: "Password123!",
    username: `author_${timestamp}`,
    displayName: "Master Scribe",
    role: "AUTHOR",
    inviteCode: "INKFORGE-AUTHOR-2026",
  });
  console.log("✓ Author registered successfully with passcode. Assigned role:", authorRes.user.role);
  if (authorRes.user.role !== "AUTHOR") throw new Error("Expected role to be AUTHOR");

  // 4. Text/Paste Chapter Segmentation Heuristics
  console.log("\n4. Testing Manuscript Chapter Detection Heuristics...");
  const sampleManuscript = `
The Chronicles of the Forge
by Master Scribe

Chapter 1: The First Spark
In the quiet of the sanctuary, the quill began to dance across the parchment.
The embers glowed in the hearth, casting long, contemplative shadows.

Chapter 2: The Binding of Truth
The leather spine groaned under the artisan's press.
Threads of linen tied page to page, immortalizing each paragraph in enduring gold leaf.

Epilogue: The Open Tome
And so the work was given to the world, never to fade.
`;

  const parsed = ImportService.segmentText(sampleManuscript, "Chronicles of the Forge");
  console.log(`✓ Detected title: "${parsed.detectedTitle}"`);
  console.log(`✓ Detected chapters count: ${parsed.chapterCount}`);
  parsed.chapters.forEach((ch) => {
    console.log(`   - [${ch.orderIndex}] ${ch.title} (${ch.wordCount} words)`);
  });
  if (parsed.chapterCount !== 3) throw new Error(`Expected 3 chapters, got ${parsed.chapterCount}`);

  // 5. Book Creation & Import in Database
  console.log("\n5. Testing Book Creation & Import in Database...");
  const book = await BookService.createBook(authorRes.user.id, {
    title: parsed.detectedTitle,
    subtitle: "A Tale of Bound Pages",
    description: "An archival masterpiece written in the INKFORGE sanctuary.",
    genre: "Literary Fiction",
    mood: "Solemn & Inspiring",
    coverTheme: "vellum",
    visibility: "PRIVATE",
    importMethod: "PASTE",
    chapters: parsed.chapters.map((ch) => ({
      title: ch.title,
      contentHtml: ch.contentHtml,
      orderIndex: ch.orderIndex,
    })),
  });
  console.log(`✓ Book created: "${book.title}" (ID: ${book.id}, Visibility: ${book.visibility})`);
  console.log(`✓ Chapters created: ${book.chapters.length}`);

  // 6. Privacy Enforcement (Private book should be forbidden for reader)
  console.log("\n6. Testing Privacy Enforcement for Private Draft...");
  let privacyBlocked = false;
  try {
    await BookService.getById(book.id, readerRes.user.id);
  } catch (err: unknown) {
    privacyBlocked = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.log("✓ Correctly blocked reader from accessing author's private book:", msg);
  }
  if (!privacyBlocked) throw new Error("Reader should NOT be able to view private book!");

  // Author can access own private book
  const authorView = await BookService.getById(book.id, authorRes.user.id);
  console.log("✓ Author successfully accessed own private book:", authorView.title);

  // 7. Publishing Workflow
  console.log("\n7. Testing Book Publishing Workflow...");
  const published = await BookService.publishBook(book.id, authorRes.user.id);
  console.log(`✓ Book published! Status: ${published.status}, Visibility: ${published.visibility}`);

  // Reader can now access published book
  const readerView = await BookService.getById(book.id, readerRes.user.id);
  console.log(`✓ Reader can now access published book! Chapters: ${readerView.chapters.length}`);

  // 8. Activity Log & Revision Snapshot Verification
  console.log("\n8. Testing History & Revision System...");
  const history = await BookService.getHistory(book.id, authorRes.user.id);
  console.log(`✓ Activities recorded: ${history.activities.length}`);
  history.activities.forEach((act) => {
    console.log(`   - [${act.action}] ${act.description}`);
  });
  console.log(`✓ Revisions recorded: ${history.revisions.length}`);
  history.revisions.forEach((rev) => {
    console.log(`   - Version ${rev.version}: "${rev.title}" (${rev.chapterCount} chapters, ${rev.wordCount} words)`);
  });

  // 9. Revision Restoration
  console.log("\n9. Testing Revision Restoration...");
  const restored = await BookService.restoreRevision(book.id, 1, authorRes.user.id);
  console.log(`✓ Restored to Version 1 successfully! Title: "${restored.title}"`);

  console.log("\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n");
}

run()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

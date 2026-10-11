/**
 * INKFORGE — PHASE 4 COMPREHENSIVE VERIFICATION SUITE
 * Author Profile Management, Public Author Folios, Registry Directory & Security Isolation
 *
 * Verifies all Phase 4 requirements:
 * 1. Database Connectivity & Schema Health
 * 2. Setup Test Authors (Author Alpha & Author Beta)
 * 3. Authenticated Author Profile Retrieval (Safe Payload, Excludes passwordHash)
 * 4. Author Profile Update (displayName, bio, websiteUrl, location across User & Profile)
 * 5. Username Normalization & Unique Slug Alignment (lowercase enforcement)
 * 6. Username Collision Defense (ConflictError 409 on duplicate handles)
 * 7. Username Format Validation (Min/Max lengths, alphanumeric, underscores, hyphens)
 * 8. Field Constraint & URL Sanitization Checks (Display name, bio limits, safe URLs)
 * 9. Public Author Folio Resolution (Permitted public fields, zero email/hash leakage)
 * 10. Publication Privacy & Draft Isolation (Strictly PUBLISHED works; zero draft exposure)
 * 11. Unknown Author Handle Handling (NotFoundError 404 for nonexistent handles)
 * 12. Author Directory Registry (Lists authors with published folios and counts)
 * 13. Canonical Article URL Independence (Updating handle preserves published article slugs)
 * 14. Empty Author Profile Resilience (Zero publications return clean empty list)
 * 15. Clean Database Teardown
 */

import { checkDatabaseConnection, prisma } from "../lib/db";
import { AuthService } from "../lib/services/auth.service";
import { UserService } from "../lib/services/user.service";
import { DocumentService } from "../lib/services/document.service";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../lib/errors";

async function runPhase4Verification() {
  console.log("================================================================================");
  console.log("            INKFORGE PHASE 4: AUTHOR PROFILE & PUBLICATION MANAGEMENT           ");
  console.log("  Profile Editing, Public Folio, Username Normalization & Draft Privacy         ");
  console.log("================================================================================\n");

  (process.env as any).NODE_ENV = "test";
  const runId = Date.now().toString().slice(-6);

  // 1. Database Connectivity
  console.log("[Test 1] Verifying Database Connectivity...");
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.status !== "connected") {
    throw new Error(`Database connection failed: ${dbHealth.error}`);
  }
  console.log("  ✓ Database connected and healthy (SQLite / Prisma)\n");

  // 2. Setup Test Authors
  console.log("[Test 2] Setting up Test Authors (Author Alpha & Author Beta)...");
  const authorDataA = {
    email: `author.p4.alpha.${runId}@inkforge.test`,
    password: "AuthorAlphaPass123!",
    username: `p4_alpha_${runId}`,
    displayName: "Author P4 Alpha",
  };
  const authorDataB = {
    email: `author.p4.beta.${runId}@inkforge.test`,
    password: "AuthorBetaPass456!",
    username: `p4_beta_${runId}`,
    displayName: "Author P4 Beta",
  };

  const regA = await AuthService.register(authorDataA);
  const authorAId = regA.user.id;
  console.log(`  ✓ Registered Author Alpha (ID: ${authorAId}, username: ${regA.user.username})`);

  const regB = await AuthService.register(authorDataB);
  const authorBId = regB.user.id;
  console.log(`  ✓ Registered Author Beta (ID: ${authorBId}, username: ${regB.user.username})\n`);

  let pubDocId = "";
  let pubDocSlug = "";
  let draftDocId = "";

  try {
    // 3. Authenticated Author Profile Retrieval
    console.log("[Test 3] Verifying authenticated author profile retrieval...");
    const profileA = await UserService.getAuthorProfile(authorAId);
    if (!profileA || profileA.id !== authorAId) {
      throw new Error("Failed to retrieve author profile by ID.");
    }
    if ("passwordHash" in profileA) {
      throw new Error("CRITICAL SECURITY FLAW: passwordHash leaked in author profile payload!");
    }
    if (profileA.username !== `p4_alpha_${runId}`) {
      throw new Error(`Expected username p4_alpha_${runId}, got ${profileA.username}`);
    }
    console.log("  ✓ Profile retrieved safely; passwordHash strictly excluded.\n");

    // 4. Update Profile Fields (displayName, bio, websiteUrl, location)
    console.log("[Test 4] Updating author profile fields...");
    const updatedA = await UserService.updateAuthorProfile(authorAId, {
      displayName: "Elena Rostova-Alpha",
      bio: "Scholar of architectural typography and immutable web scrolls.",
      location: "Stockholm, Sweden",
      websiteUrl: "https://elena.inkforge.org/arch",
    });

    if (updatedA.displayName !== "Elena Rostova-Alpha") {
      throw new Error(`Expected displayName 'Elena Rostova-Alpha', got '${updatedA.displayName}'`);
    }
    if (updatedA.bio !== "Scholar of architectural typography and immutable web scrolls.") {
      throw new Error("Bio update failed on user object.");
    }
    if (updatedA.profile?.location !== "Stockholm, Sweden") {
      throw new Error("Location update failed on profile object.");
    }
    if (updatedA.profile?.websiteUrl !== "https://elena.inkforge.org/arch") {
      throw new Error("Website URL update failed on profile object.");
    }
    console.log("  ✓ Permitted profile fields updated atomically across User and Profile tables.\n");

    // 5. Username Normalization & Update
    console.log("[Test 5] Testing username normalization & update...");
    const uppercaseHandle = `P4_ALPHA_NORM_${runId}`;
    const expectedNormalized = uppercaseHandle.toLowerCase();

    const normalizedUser = await UserService.updateAuthorProfile(authorAId, {
      username: uppercaseHandle,
    });

    if (normalizedUser.username !== expectedNormalized) {
      throw new Error(
        `Username was not normalized to lowercase! Expected '${expectedNormalized}', got '${normalizedUser.username}'`
      );
    }
    if (normalizedUser.profile?.slug !== expectedNormalized) {
      throw new Error(
        `Profile slug was not updated to normalized handle! Expected '${expectedNormalized}', got '${normalizedUser.profile?.slug}'`
      );
    }
    console.log(`  ✓ Username normalized to lowercase '${expectedNormalized}' and profile slug updated.\n`);

    // 6. Username Collision Defense
    console.log("[Test 6] Testing username collision defense (Author Beta claims Author Alpha's handle)...");
    let collisionCaught = false;
    try {
      await UserService.updateAuthorProfile(authorBId, {
        username: expectedNormalized, // Alpha's current handle
      });
    } catch (err) {
      if (err instanceof ConflictError) {
        collisionCaught = true;
        console.log(`  ✓ ConflictError correctly raised: "${err.message}"`);
      } else {
        throw new Error(`Unexpected error type on username collision: ${err}`);
      }
    }
    if (!collisionCaught) {
      throw new Error("CRITICAL DEFECT: Duplicate username was allowed without ConflictError!");
    }
    console.log("  ✓ Collision prevention verified.\n");

    // 7. Username Format Validation
    console.log("[Test 7] Testing username format validations (short, long, invalid characters)...");
    const invalidUsernames = [
      { handle: "ab", desc: "too short (< 3 chars)" },
      { handle: "this_username_is_way_too_long_and_exceeds_thirty_chars", desc: "too long (> 30 chars)" },
      { handle: "author@inkforge", desc: "forbidden '@' character" },
      { handle: "author name", desc: "forbidden whitespace" },
      { handle: "author#123", desc: "forbidden '#' character" },
    ];

    for (const testCase of invalidUsernames) {
      let rejected = false;
      try {
        await UserService.updateAuthorProfile(authorBId, { username: testCase.handle });
      } catch (err) {
        if (err instanceof ValidationError) {
          rejected = true;
        } else {
          throw new Error(`Expected ValidationError for ${testCase.desc}, got ${err}`);
        }
      }
      if (!rejected) {
        throw new Error(`CRITICAL DEFECT: Invalid username '${testCase.handle}' (${testCase.desc}) was accepted!`);
      }
      console.log(`  ✓ Correctly rejected ${testCase.desc} ('${testCase.handle}')`);
    }
    console.log("  ✓ All username validation constraints verified.\n");

    // 8. Field Constraints & XSS URL Sanitization
    console.log("[Test 8] Testing field length limits and URL sanitization...");
    let emptyNameRejected = false;
    try {
      await UserService.updateAuthorProfile(authorBId, { displayName: "   " });
    } catch (err) {
      if (err instanceof ValidationError) emptyNameRejected = true;
    }
    if (!emptyNameRejected) {
      throw new Error("Blank display name was not rejected!");
    }

    let longBioRejected = false;
    try {
      await UserService.updateAuthorProfile(authorBId, { bio: "X".repeat(501) });
    } catch (err) {
      if (err instanceof ValidationError) longBioRejected = true;
    }
    if (!longBioRejected) {
      throw new Error("Bio exceeding 500 characters was not rejected!");
    }

    // Malicious javascript URL test
    const xssUpdated = await UserService.updateAuthorProfile(authorBId, {
      websiteUrl: "javascript:alert('xss')",
    });
    if (xssUpdated.profile?.websiteUrl !== null && xssUpdated.profile?.websiteUrl !== "#") {
      throw new Error(`CRITICAL SECURITY FLAW: JavaScript URL was not sanitized! Got: ${xssUpdated.profile?.websiteUrl}`);
    }
    console.log("  ✓ Field constraints enforced and malicious URLs sanitized.\n");

    // 9. Public Author Folio Resolution & Privacy Check
    console.log("[Test 9] Testing public author folio query via username handle...");
    const publicFolio = await UserService.getPublicAuthorByUsername(expectedNormalized);
    if (!publicFolio || publicFolio.username !== expectedNormalized) {
      throw new Error("Failed to retrieve public author folio by username.");
    }
    if ((publicFolio as any).email !== undefined) {
      throw new Error("CRITICAL PRIVACY VIOLATION: Author email exposed on public author folio!");
    }
    if ((publicFolio as any).passwordHash !== undefined) {
      throw new Error("CRITICAL SECURITY FLAW: passwordHash exposed on public author folio!");
    }
    if ((publicFolio as any).emailVerified !== undefined) {
      throw new Error("CRITICAL PRIVACY VIOLATION: emailVerified exposed on public author folio!");
    }
    console.log("  ✓ Public folio returned safe fields; sensitive identity tokens strictly omitted.\n");

    // 10. Publication Privacy & Draft Isolation
    console.log("[Test 10] Testing draft isolation in author folio (1 published vs 1 draft)...");
    // Author Alpha creates and publishes Document 1
    const pubDoc = await DocumentService.createDocument(
      {
        title: "The Permanence of the Inscribed Monograph",
        subtitle: "A treatise on timeless software essays",
        excerpt: "Where words withstand the erosion of transient platforms.",
        contentHtml: "<p>The inscribed monograph is the bedrock of enduring thought.</p>",
        contentJson: JSON.stringify({ type: "doc" }),
      },
      authorAId
    );
    pubDocId = pubDoc.id;
    pubDocSlug = pubDoc.slug;

    // Publish Document 1
    await DocumentService.publishDocument(pubDocId, authorAId, pubDoc.version);

    // Author Alpha creates Document 2 as an unpublished private DRAFT
    const draftDoc = await DocumentService.createDocument(
      {
        title: "Private Unfinished Scratchpad Note",
        subtitle: "Draft not intended for public readership",
        excerpt: "Secret notes.",
        contentHtml: "<p>Unpublished work in progress.</p>",
        contentJson: JSON.stringify({ type: "doc" }),
      },
      authorAId
    );
    draftDocId = draftDoc.id;

    // Retrieve public author folio
    const folioWithWorks = await UserService.getPublicAuthorByUsername(expectedNormalized);
    if (!folioWithWorks.posts || folioWithWorks.posts.length !== 1) {
      throw new Error(
        `Expected exactly 1 published post in author folio, got ${folioWithWorks.posts?.length}`
      );
    }
    if (folioWithWorks.posts[0].id !== pubDocId) {
      throw new Error(`Expected published post ID '${pubDocId}', got '${folioWithWorks.posts[0].id}'`);
    }

    // Explicitly verify the draft document is NOT in the public response
    const leakedDraft = folioWithWorks.posts.find((p) => p.id === draftDocId);
    if (leakedDraft) {
      throw new Error("CRITICAL PRIVACY VIOLATION: Unpublished draft leaked on public author folio!");
    }
    console.log("  ✓ Draft isolation verified: 1 published monograph visible; 0 private drafts leaked.\n");

    // 11. Unknown Author Handle Handling (NotFoundError 404)
    console.log("[Test 11] Testing unknown author handle query (expect NotFoundError 404)...");
    let notFoundCaught = false;
    try {
      await UserService.getPublicAuthorByUsername(`nonexistent_author_${runId}_xyz`);
    } catch (err) {
      if (err instanceof NotFoundError) {
        notFoundCaught = true;
        console.log(`  ✓ NotFoundError correctly raised: "${err.message}"`);
      } else {
        throw new Error(`Unexpected error type on missing author: ${err}`);
      }
    }
    if (!notFoundCaught) {
      throw new Error("Missing author did not trigger NotFoundError!");
    }
    console.log("  ✓ Unknown handle handled with 404 NotFoundError.\n");

    // 12. Author Directory Registry
    console.log("[Test 12] Testing author directory registry (UserService.listPublicAuthors)...");
    const authorDirectory = await UserService.listPublicAuthors(50);
    const directoryEntryA = authorDirectory.find((a) => a.id === authorAId);
    if (!directoryEntryA) {
      throw new Error("Author Alpha with published monograph missing from author directory!");
    }
    if (directoryEntryA.publishedCount !== 1) {
      throw new Error(`Expected publishedCount 1 for Author Alpha, got ${directoryEntryA.publishedCount}`);
    }

    // Author Beta has 0 published posts; verify Author Beta is not listed among published authors
    const directoryEntryB = authorDirectory.find((a) => a.id === authorBId);
    if (directoryEntryB) {
      throw new Error("CRITICAL DEFECT: Author with 0 published works incorrectly listed in directory!");
    }
    console.log("  ✓ Directory listing verified: authors with published monographs listed with accurate counts.\n");

    // 13. Canonical Article URL Independence
    console.log("[Test 13] Testing canonical article URL independence after author handle change...");
    const renamedHandle = `p4_alpha_final_${runId}`;
    await UserService.updateAuthorProfile(authorAId, { username: renamedHandle });

    // Verify original published article is still retrievable via its original canonical slug
    const resolvedDoc = await DocumentService.getDocumentBySlug(pubDocSlug);
    if (!resolvedDoc || resolvedDoc.id !== pubDocId) {
      throw new Error("Canonical document resolution broke after author handle was updated!");
    }
    if (resolvedDoc.author.username !== renamedHandle) {
      throw new Error(
        `Expected document's author username to reflect '${renamedHandle}', got '${resolvedDoc.author.username}'`
      );
    }
    console.log(`  ✓ Article slug '${pubDocSlug}' resolved cleanly; author reflects '${renamedHandle}'.\n`);

    // 14. Empty Author Profile Resilience
    console.log("[Test 14] Testing author profile with 0 published works (Author Beta)...");
    const emptyFolio = await UserService.getPublicAuthorByUsername(`p4_beta_${runId}`);
    if (!emptyFolio || !Array.isArray(emptyFolio.posts) || emptyFolio.posts.length !== 0) {
      throw new Error("Expected empty posts array for author with zero published works.");
    }
    console.log("  ✓ Author with 0 published works returns clean empty posts array.\n");

    console.log("================================================================================");
    console.log("          ALL 14 PHASE 4 VERIFICATION SUITE CHECKS PASSED PERFECTLY             ");
    console.log("================================================================================\n");
  } finally {
    // 15. Clean Database Teardown
    console.log("[Teardown] Cleaning up Phase 4 test artifacts...");
    try {
      if (pubDocId) {
        await prisma.postRevision.deleteMany({ where: { postId: pubDocId } });
        await prisma.post.deleteMany({ where: { id: pubDocId } });
      }
      if (draftDocId) {
        await prisma.postRevision.deleteMany({ where: { postId: draftDocId } });
        await prisma.post.deleteMany({ where: { id: draftDocId } });
      }
      if (authorAId) {
        await prisma.profile.deleteMany({ where: { userId: authorAId } });
        await prisma.session.deleteMany({ where: { userId: authorAId } });
        await prisma.user.deleteMany({ where: { id: authorAId } });
      }
      if (authorBId) {
        await prisma.profile.deleteMany({ where: { userId: authorBId } });
        await prisma.session.deleteMany({ where: { userId: authorBId } });
        await prisma.user.deleteMany({ where: { id: authorBId } });
      }
      console.log("  ✓ Database teardown complete; test artifacts removed.\n");
    } catch (cleanupError) {
      console.warn("  ⚠ Warning during teardown:", cleanupError);
    }
  }
}

runPhase4Verification()
  .then(() => {
    console.log("Phase 4 verification completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ PHASE 4 VERIFICATION FAILED:");
    console.error(err);
    process.exit(1);
  });

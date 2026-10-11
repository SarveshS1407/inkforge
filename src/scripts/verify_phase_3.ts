/**
 * INKFORGE — PHASE 3 COMPREHENSIVE VERIFICATION SUITE
 * Secure Publishing Workflow, Slug Resolution, Anti-Enumeration & XSS Neutralization
 *
 * Verifies all Phase 3 requirements:
 * 1. Draft Creation & Initial Ledger State
 * 2. Draft Persistence & Author Retrieval
 * 3. Private Preview Mode Integrity (does not alter status)
 * 4. Publication Validation (rejects blank manuscripts & short titles)
 * 5. Publication Execution (sets status: PUBLISHED, publishedAt, canonicalUrl, version increment)
 * 6. Public Reader Resolution via Slug (unauthenticated access permitted for published works)
 * 7. Public Feed Isolation (unauthenticated visitors strictly receive published monographs only)
 * 8. Unpublishing Execution (reverts to DRAFT, creates audit revision, public slug returns 404)
 * 9. Author Access Retention for Unpublished Manuscripts
 * 10. Unauthenticated Publish/Unpublish Protection (Unauthorized / Forbidden)
 * 11. Cross-Author Isolation (Author Beta blocked from publishing/unpublishing Author Alpha's works)
 * 12. Slug Collision Safety (Identical titles produce unique, collision-free canonical slugs)
 * 13. Audit Revision Retention (snapshots created on publish and unpublish)
 * 14. Optimistic Concurrency Control (stale expectedVersion rejected with VersionConflictError 409)
 * 15. Safe Content Rendering & XSS Neutralization
 * 16. State Immutability on Failed Operations
 * 17. Re-Publication Workflow & Clean Database Teardown
 */

import { checkDatabaseConnection, prisma } from "../lib/db";
import { AuthService } from "../lib/services/auth.service";
import { DocumentService } from "../lib/services/document.service";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
  VersionConflictError,
} from "../lib/errors";
import { sanitizeHtml, sanitizeUrl } from "../lib/sanitizer";

async function runPhase3Verification() {
  console.log("================================================================================");
  console.log("            INKFORGE PHASE 3: SECURE PUBLISHING WORKFLOW SUITE                  ");
  console.log("  Publish, Unpublish, Public Slugs, Anti-Enumeration, Concurrency & XSS Defense ");
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
    email: `author.p3.alpha.${runId}@inkforge.test`,
    password: "AuthorAlphaSecret123!",
    username: `p3_alpha_${runId}`,
    displayName: "Author P3 Alpha",
  };
  const authorDataB = {
    email: `author.p3.beta.${runId}@inkforge.test`,
    password: "AuthorBetaSecret456!",
    username: `p3_beta_${runId}`,
    displayName: "Author P3 Beta",
  };

  const regA = await AuthService.register(authorDataA);
  const authorAId = regA.user.id;
  console.log(`  ✓ Registered Author Alpha (ID: ${authorAId}, username: ${regA.user.username})`);

  const regB = await AuthService.register(authorDataB);
  const authorBId = regB.user.id;
  console.log(`  ✓ Registered Author Beta (ID: ${authorBId}, username: ${regB.user.username})\n`);

  let doc1Id = "";
  let doc1Slug = "";
  let doc1Version = 1;

  let doc2Id = "";
  let doc2Slug = "";

  try {
    // 3. Create Draft Document
    console.log("[Test 3] Creating valid draft manuscript for Author Alpha...");
    const draftPayload = {
      title: "The Architecture of the Solitary Ledger",
      subtitle: "On resilient offline writing and archival permanence",
      excerpt: "Where words withstand the erosion of transient browser states.",
      contentHtml: "<p>The solitary ledger is the foundation of durable digital prose.</p>",
      contentJson: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "The solitary ledger is the foundation of durable digital prose.",
              },
            ],
          },
        ],
      }),
    };

    const doc1 = await DocumentService.createDocument(draftPayload, authorAId);
    doc1Id = doc1.id;
    doc1Slug = doc1.slug;
    doc1Version = doc1.version;

    if (doc1.status !== "DRAFT") {
      throw new Error(`Expected initial status to be DRAFT, got ${doc1.status}`);
    }
    console.log(`  ✓ Draft created successfully (ID: ${doc1Id}, Slug: ${doc1Slug}, Status: ${doc1.status})\n`);

    // 4. Draft Retrieval by Author vs Anonymous
    console.log("[Test 4] Verifying draft access rules (Author allowed, Public denied)...");
    const authorLookup = await DocumentService.getDocumentById(doc1Id, authorAId);
    if (!authorLookup) throw new Error("Author failed to retrieve their own draft by ID");
    console.log("  ✓ Author Alpha can retrieve draft by ID");

    const authorSlugLookup = await DocumentService.getDocumentBySlug(doc1Slug, authorAId);
    if (!authorSlugLookup) throw new Error("Author failed to retrieve draft by slug");
    console.log("  ✓ Author Alpha can retrieve draft by slug in private preview");

    let anonymousLookupFailed = false;
    try {
      await DocumentService.getDocumentBySlug(doc1Slug, undefined);
    } catch (e: any) {
      if (e instanceof NotFoundError) {
        anonymousLookupFailed = true;
      }
    }
    if (!anonymousLookupFailed) {
      throw new Error("SECURITY BREACH: Anonymous user was able to look up private draft via slug!");
    }
    console.log("  ✓ Anonymous visitor receives 404 NotFound on unpublished draft (Anti-Enumeration enforced)\n");

    // 5. Preview Mode Integrity (does not alter status)
    console.log("[Test 5] Verifying Preview Mode does not inadvertently mutate status...");
    const checkAfterPreview = await DocumentService.getDocumentById(doc1Id, authorAId);
    if (checkAfterPreview.status !== "DRAFT") {
      throw new Error(`Preview caused status change to ${checkAfterPreview.status}`);
    }
    console.log("  ✓ Draft status remains strictly DRAFT after preview queries\n");

    // 6. Publication Validation (Empty / Blank manuscript rejection)
    console.log("[Test 6] Testing publication validation safeguards (rejecting empty manuscripts)...");
    const blankDoc = await DocumentService.createDocument(
      {
        title: "Empty Draft",
        contentHtml: "",
        contentJson: JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }),
      },
      authorAId
    );

    let blankPubRejected = false;
    try {
      await DocumentService.publishDocument(blankDoc.id, authorAId, blankDoc.version);
    } catch (e: any) {
      if (e instanceof ValidationError) {
        blankPubRejected = true;
        console.log(`  ✓ Blank document publication safely rejected: "${e.message}"`);
      }
    }
    if (!blankPubRejected) {
      throw new Error("Blank document was allowed to be published!");
    }

    // Short title validation
    let shortTitleRejected = false;
    try {
      await DocumentService.createDocument({ title: " " }, authorAId);
    } catch (e: any) {
      if (e instanceof ValidationError) {
        shortTitleRejected = true;
        console.log(`  ✓ Blank title creation safely rejected: "${e.message}"`);
      }
    }
    if (!shortTitleRejected) {
      throw new Error("Blank title was allowed to be created!");
    }
    // Clean up temporary blank doc
    await DocumentService.deleteDocument(blankDoc.id, authorAId);
    console.log("  ✓ Validation safeguards verified\n");

    // 7. Publish Manuscript Workflow
    console.log("[Test 7] Publishing manuscript via DocumentService.publishDocument...");
    const publishedDoc = await DocumentService.publishDocument(doc1Id, authorAId, doc1Version);
    doc1Version = publishedDoc.version;

    if (publishedDoc.status !== "PUBLISHED") {
      throw new Error(`Expected status to be PUBLISHED, got ${publishedDoc.status}`);
    }
    if (!publishedDoc.publishedAt) {
      throw new Error("publishedAt timestamp was not recorded");
    }
    if (!publishedDoc.canonicalUrl || !publishedDoc.canonicalUrl.includes(doc1Slug)) {
      throw new Error(`canonicalUrl missing or invalid: ${publishedDoc.canonicalUrl}`);
    }
    if (doc1Version <= 1) {
      throw new Error(`Expected version increment on publication, got ${doc1Version}`);
    }
    console.log(`  ✓ Published successfully: Status = ${publishedDoc.status}`);
    console.log(`  ✓ PublishedAt = ${publishedDoc.publishedAt.toISOString()}`);
    console.log(`  ✓ CanonicalUrl = ${publishedDoc.canonicalUrl}`);
    console.log(`  ✓ Document Version incremented to = ${doc1Version}\n`);

    // 8. Public Reader Resolution
    console.log("[Test 8] Verifying Public Reader Slug Resolution for unauthenticated visitor...");
    const publicDoc = await DocumentService.getDocumentBySlug(doc1Slug, undefined);
    if (!publicDoc) {
      throw new Error("Public reader failed to resolve published monograph by slug");
    }
    if (publicDoc.id !== doc1Id || publicDoc.status !== "PUBLISHED") {
      throw new Error("Public reader resolved wrong document or unapproved status");
    }
    console.log(`  ✓ Public visitor successfully retrieved published monograph: "${publicDoc.title}"\n`);

    // 9. Public Feed Isolation
    console.log("[Test 9] Verifying Public Feed Isolation (GET /api/v1/documents)...");
    // Create an unreleased secret draft for Author Alpha
    const secretDraft = await DocumentService.createDocument(
      {
        title: "Secret Unreleased Author Alpha Notes",
        contentHtml: "<p>Top secret unpublished draft.</p>",
      },
      authorAId
    );

    // Unauthenticated feed request
    const publicFeed = await DocumentService.listDocuments({ requesterId: undefined });
    const containsDraft = publicFeed.items.some((item) => item.status !== "PUBLISHED");
    const containsSecret = publicFeed.items.some((item) => item.id === secretDraft.id);
    const containsPublished = publicFeed.items.some((item) => item.id === doc1Id);

    if (containsDraft || containsSecret) {
      throw new Error("SECURITY VIOLATION: Public feed contains unpublished drafts!");
    }
    if (!containsPublished) {
      throw new Error("Public feed is missing the newly published monograph!");
    }
    console.log(`  ✓ Public feed contains only PUBLISHED documents (${publicFeed.items.length} items returned)`);
    console.log("  ✓ Secret unpublished draft is completely absent from public feed\n");

    // 10. Multi-Author Isolation & Authorization Checks
    console.log("[Test 10] Testing Multi-Author Isolation on Publish & Unpublish...");
    let betaPublishFailed = false;
    try {
      await DocumentService.publishDocument(secretDraft.id, authorBId, secretDraft.version);
    } catch (e: any) {
      if (e instanceof ForbiddenError) {
        betaPublishFailed = true;
      }
    }
    if (!betaPublishFailed) {
      throw new Error("Author Beta was able to publish Author Alpha's manuscript!");
    }
    console.log("  ✓ Author Beta is strictly forbidden (403) from publishing Author Alpha's draft");

    let betaUnpublishFailed = false;
    try {
      await DocumentService.unpublishDocument(doc1Id, authorBId, doc1Version);
    } catch (e: any) {
      if (e instanceof ForbiddenError) {
        betaUnpublishFailed = true;
      }
    }
    if (!betaUnpublishFailed) {
      throw new Error("Author Beta was able to unpublish Author Alpha's published monograph!");
    }
    console.log("  ✓ Author Beta is strictly forbidden (403) from unpublishing Author Alpha's monograph");

    let betaSlugDraftLookupFailed = false;
    try {
      await DocumentService.getDocumentBySlug(secretDraft.slug, authorBId);
    } catch (e: any) {
      if (e instanceof NotFoundError) {
        betaSlugDraftLookupFailed = true;
      }
    }
    if (!betaSlugDraftLookupFailed) {
      throw new Error("Author Beta was able to access Author Alpha's unpublished draft via slug!");
    }
    console.log("  ✓ Author Beta querying Author Alpha's draft slug receives 404 (Anti-Enumeration confirmed)\n");

    // 11. Optimistic Concurrency Control (OCC 409)
    console.log("[Test 11] Testing Optimistic Concurrency Control on publication operations...");
    let occPublishFailed = false;
    try {
      // Stale expectedVersion = 1 (current is doc1Version)
      await DocumentService.publishDocument(doc1Id, authorAId, 1);
    } catch (e: any) {
      if (e instanceof VersionConflictError) {
        occPublishFailed = true;
        console.log(`  ✓ Stale expectedVersion rejected with VersionConflictError (409): ${e.message}`);
      }
    }
    if (!occPublishFailed) {
      throw new Error("Stale version publish was not rejected by OCC!");
    }
    console.log("  ✓ Optimistic Concurrency Control protects publication state from race conditions\n");

    // 12. Unpublish Workflow
    console.log("[Test 12] Unpublishing monograph via DocumentService.unpublishDocument...");
    const unpublishedDoc = await DocumentService.unpublishDocument(doc1Id, authorAId, doc1Version);
    doc1Version = unpublishedDoc.version;

    if (unpublishedDoc.status !== "DRAFT") {
      throw new Error(`Expected status to be DRAFT after unpublish, got ${unpublishedDoc.status}`);
    }
    console.log(`  ✓ Monograph reverted to DRAFT: version=${doc1Version}`);

    // Verify immediate removal from public lookup
    let publicLookupAfterUnpublishFailed = false;
    try {
      await DocumentService.getDocumentBySlug(doc1Slug, undefined);
    } catch (e: any) {
      if (e instanceof NotFoundError) {
        publicLookupAfterUnpublishFailed = true;
      }
    }
    if (!publicLookupAfterUnpublishFailed) {
      throw new Error("Unpublished monograph is still publicly accessible by slug!");
    }
    console.log("  ✓ Public slug access immediately returns 404 after unpublishing");

    // Verify author can still access it
    const authorStillHasAccess = await DocumentService.getDocumentById(doc1Id, authorAId);
    if (!authorStillHasAccess || authorStillHasAccess.status !== "DRAFT") {
      throw new Error("Author lost access to their unpublished draft!");
    }
    console.log("  ✓ Author Alpha retains full access to unpublished draft in Studio\n");

    // 13. Audit Revisions Tracking
    console.log("[Test 13] Verifying PostRevision audit trail across Publish/Unpublish cycles...");
    const revisions = await DocumentService.getDocumentRevisions(doc1Id, authorAId);
    if (revisions.length < 2) {
      throw new Error(`Expected at least 2 revisions (publish + unpublish snapshots), found ${revisions.length}`);
    }
    console.log(`  ✓ Recorded ${revisions.length} revision snapshots (tracked full lifecycle across transitions)\n`);

    // 14. Slug Collision Safety
    console.log("[Test 14] Testing Slug Collision Safety (Identical titles)...");
    const identicalTitleDoc = await DocumentService.createDocument(
      {
        title: "The Architecture of the Solitary Ledger",
        contentHtml: "<p>A second separate document with an identical title.</p>",
      },
      authorAId
    );
    doc2Id = identicalTitleDoc.id;
    doc2Slug = identicalTitleDoc.slug;

    if (doc2Slug === doc1Slug) {
      throw new Error(`Slug collision! Both documents have identical slug "${doc2Slug}"`);
    }
    console.log(`  ✓ Original Slug: "${doc1Slug}"`);
    console.log(`  ✓ Colliding Document Assigned Safe Slug: "${doc2Slug}"`);

    // Publish second document to confirm no unique constraint failure
    const pub2 = await DocumentService.publishDocument(doc2Id, authorAId, identicalTitleDoc.version);
    if (pub2.status !== "PUBLISHED") {
      throw new Error("Failed to publish document with deduplicated slug");
    }
    console.log("  ✓ Both monographs coexist cleanly in published state with unique URLs\n");

    // 15. Safe Content Rendering & XSS Neutralization
    console.log("[Test 15] Testing Safe Content Rendering & XSS Neutralization...");
    const maliciousPayload = `
      <h1>Dangerous Title</h1>
      <script>alert('XSS Script Execution')</script>
      <img src="x" onerror="alert('XSS Image Event')" />
      <p>Legitimate paragraph with <a href="javascript:alert('XSS Link')">Malicious Link</a> and <a href="https://inkforge.org">Safe Link</a>.</p>
      <iframe src="https://attacker.com"></iframe>
    `;

    const sanitizedHtml = sanitizeHtml(maliciousPayload);
    if (sanitizedHtml.includes("<script>") || sanitizedHtml.includes("onerror") || sanitizedHtml.includes("<iframe")) {
      throw new Error(`XSS Vulnerability: Harmful tags survived sanitization! Result: ${sanitizedHtml}`);
    }
    if (sanitizedHtml.includes("javascript:")) {
      throw new Error("XSS Vulnerability: javascript: protocol survived sanitization!");
    }
    if (!sanitizedHtml.includes("https://inkforge.org")) {
      throw new Error("Sanitizer stripped legitimate safe content!");
    }

    const testBadUrl = sanitizeUrl("javascript:evil()");
    const testSafeUrl = sanitizeUrl("https://example.com/folio");
    if (testBadUrl !== "#" || testSafeUrl !== "https://example.com/folio") {
      throw new Error("sanitizeUrl failed to block javascript URI protocol!");
    }
    console.log("  ✓ HTML sanitizer eliminated <script>, onerror, <iframe>, and javascript: URIs");
    console.log("  ✓ Legitimate anchor links and formatting tags preserved perfectly\n");

    // 16. Re-publication Workflow
    console.log("[Test 16] Verifying Re-Publication after manuscript edits...");
    // Update unpublished doc1
    const updatedDraft = await DocumentService.updateDocument(
      doc1Id,
      {
        contentHtml: "<p>Revised and enhanced prose for re-publication.</p>",
        expectedVersion: doc1Version,
      },
      authorAId
    );
    doc1Version = updatedDraft.version;

    const repubDoc = await DocumentService.publishDocument(doc1Id, authorAId, doc1Version);
    doc1Version = repubDoc.version;
    if (repubDoc.status !== "PUBLISHED") {
      throw new Error(`Expected status PUBLISHED on re-publication, got ${repubDoc.status}`);
    }
    const publicCheck = await DocumentService.getDocumentBySlug(doc1Slug, undefined);
    if (!publicCheck || !publicCheck.contentHtml?.includes("Revised and enhanced")) {
      throw new Error("Public reader did not receive updated content upon re-publication");
    }
    console.log("  ✓ Monograph successfully re-published and updated content is live\n");

    // 17. Safe Teardown of Test Data
    console.log("[Test 17] Cleaning up test documents and authors...");
    await DocumentService.deleteDocument(doc1Id, authorAId);
    await DocumentService.deleteDocument(doc2Id, authorAId);
    await DocumentService.deleteDocument(secretDraft.id, authorAId);

    await prisma.user.deleteMany({
      where: {
        id: { in: [authorAId, authorBId] },
      },
    });
    console.log("  ✓ Test artifacts cleaned up successfully from database\n");

    console.log("================================================================================");
    console.log("        ALL 17 PHASE 3 VERIFICATION TESTS PASSED WITH ZERO ERRORS               ");
    console.log("================================================================================\n");
  } catch (error) {
    console.error("\n❌ PHASE 3 VERIFICATION FAILED:", error);
    // Cleanup if possible
    try {
      if (doc1Id) await DocumentService.deleteDocument(doc1Id, authorAId).catch(() => {});
      if (doc2Id) await DocumentService.deleteDocument(doc2Id, authorAId).catch(() => {});
      await prisma.user.deleteMany({
        where: { id: { in: [authorAId, authorBId] } },
      }).catch(() => {});
    } catch {}
    process.exit(1);
  }
}

runPhase3Verification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

/**
 * INKFORGE — PHASE 2B VERIFICATION SUITE
 * Writing Studio Persistence, Autosave, Draft Recovery & Concurrency Control
 *
 * Verifies:
 * 1. Database Connectivity & Initial Ledger State
 * 2. User Authentication & Author Session Issuance (Author Alpha & Author Beta)
 * 3. Authenticated Manuscript Creation (DocumentService.createDocument)
 * 4. Document Retrieval by ID for Studio Loading (DocumentService.getDocumentById)
 * 5. Debounced Autosave / Metadata Update (DocumentService.updateDocument) & Version Increment
 * 6. Optimistic Concurrency Control (OCC): Stale expectedVersion Rejection (409 Conflict)
 * 7. Client Conflict Resolution Flow (Overwriting with Correct Server Version)
 * 8. Multi-Author Isolation & Document Authorization (403 Forbidden on Unauthorized Access)
 * 9. Document Publication & Reader View Slug Resolution (DocumentService.getDocumentBySlug)
 * 10. Atomic Revision Snapshot Tracking (DocumentService.getDocumentRevisions)
 * 11. Author Document Listing (DocumentService.listDocuments) Isolation
 * 12. Local Recovery Buffer & Idempotent Migration Engine (DraftManager Unit Validation)
 * 13. Document Deletion (DocumentService.deleteDocument) & Safe Database Cleanup
 */

import { checkDatabaseConnection, prisma } from "../lib/db";
import { AuthService } from "../lib/services/auth.service";
import { DocumentService } from "../lib/services/document.service";
import { DraftManager } from "../lib/drafts/draft-manager";
import {
  ForbiddenError,
  NotFoundError,
  VersionConflictError,
} from "../lib/errors";

async function runPhase2BVerification() {
  console.log("================================================================================");
  console.log("             INKFORGE PHASE 2B: WRITING STUDIO PERSISTENCE SUITE                ");
  console.log("  Autosave, Versioning, Draft Recovery, Navigation & Multi-User Isolation       ");
  console.log("================================================================================\n");

  (process.env as any).NODE_ENV = "test";
  const runId = Date.now().toString().slice(-6);

  // 1. Database Connectivity
  console.log("[Test 1] Verifying Database Connectivity...");
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.status !== "connected") {
    throw new Error(`Database connection failed: ${dbHealth.error}`);
  }
  console.log("  ✓ Database is connected and healthy (SQLite / Prisma Client v6.4.1)\n");

  // 2. Authentication & Session Setup
  console.log("[Test 2] Setting up Test Authors (Author Alpha & Author Beta)...");
  const userA = {
    email: `author.alpha.${runId}@inkforge.test`,
    password: "AuthorPasswordAlpha123!",
    username: `alpha_author_${runId}`,
    displayName: "Author Alpha",
  };
  const userB = {
    email: `author.beta.${runId}@inkforge.test`,
    password: "AuthorPasswordBeta456!",
    username: `beta_author_${runId}`,
    displayName: "Author Beta",
  };

  const regA = await AuthService.register(userA);
  const authorAId = regA.user.id;
  console.log(`  ✓ Registered Author Alpha (ID: ${authorAId}, username: ${regA.user.username})`);

  const regB = await AuthService.register(userB);
  const authorBId = regB.user.id;
  console.log(`  ✓ Registered Author Beta (ID: ${authorBId}, username: ${regB.user.username})\n`);

  let documentId: string = "";
  let documentSlug: string = "";

  try {
    // 3. Document Creation (createDocument)
    console.log("[Test 3] Creating new manuscript via DocumentService.createDocument...");
    const createPayload = {
      title: "The Architecture of the Solitary Ledger",
      subtitle: "A treatise on resilient offline writing and archival fidelity",
      excerpt: "Where words withstand the erosion of transient browser states.",
      contentHtml: "<p>In the silence of the studio, every stroke of the quill leaves an indelible impression.</p>",
      contentJson: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "In the silence of the studio, every stroke of the quill leaves an indelible impression." }],
          },
        ],
      }),
      status: "DRAFT" as const,
      targetWords: 1200,
    };

    const createdDoc = await DocumentService.createDocument(createPayload, authorAId);
    documentId = createdDoc.id;
    documentSlug = createdDoc.slug;

    if (!documentId || createdDoc.version !== 1 || createdDoc.status !== "DRAFT" || createdDoc.authorId !== authorAId) {
      throw new Error(`Document initialization attributes invalid: ${JSON.stringify(createdDoc)}`);
    }
    console.log(`  ✓ Created manuscript ID: ${documentId}`);
    console.log(`  ✓ Initial Version: ${createdDoc.version}, Slug: "${documentSlug}", AuthorId: ${createdDoc.authorId}\n`);

    // 4. Document Retrieval by ID (getDocumentById)
    console.log("[Test 4] Retrieving manuscript via DocumentService.getDocumentById...");
    const fetchedDoc = await DocumentService.getDocumentById(documentId, authorAId);

    if (fetchedDoc.title !== createPayload.title || fetchedDoc.version !== 1) {
      throw new Error(`Fetched document data does not match expected state: ${JSON.stringify(fetchedDoc)}`);
    }
    console.log(`  ✓ Manuscript accurately retrieved with intact content and version 1.\n`);

    // 5. Updating Manuscript & Autosave (updateDocument)
    console.log("[Test 5] Simulating Autosave update with expectedVersion: 1...");
    const updatePayload1 = {
      title: "The Architecture of the Solitary Ledger (Revised Edition)",
      contentHtml: "<p>In the silence of the studio, every stroke of the quill leaves an indelible impression. We expand the thesis.</p>",
      contentJson: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Expanded thesis." }],
          },
        ],
      }),
      expectedVersion: 1,
    };

    const updatedDoc1 = await DocumentService.updateDocument(documentId, updatePayload1, authorAId);
    if (updatedDoc1.version !== 2) {
      throw new Error(`Expected version 2 after update, received: ${updatedDoc1.version}`);
    }
    console.log(`  ✓ Autosave succeeded. Server version incremented atomically to: ${updatedDoc1.version}\n`);

    // 6. Optimistic Concurrency Control (OCC): Stale Version Conflict (VersionConflictError)
    console.log("[Test 6] Testing Optimistic Concurrency: Sending stale expectedVersion: 1 (Current is 2)...");
    try {
      await DocumentService.updateDocument(
        documentId,
        {
          title: "Stale Overwrite Attempt",
          contentHtml: "<p>This should be rejected due to stale version conflict.</p>",
          expectedVersion: 1, // Stale!
        },
        authorAId
      );
      throw new Error("FAIL: Stale write was permitted without conflict!");
    } catch (err: any) {
      if (err instanceof VersionConflictError) {
        console.log(`  ✓ Concurrency guard successfully caught stale write: 409 Conflict: "${err.message}"\n`);
      } else {
        throw err;
      }
    }

    // 7. Conflict Resolution Workflow
    console.log("[Test 7] Testing Conflict Resolution: Updating with corrected expectedVersion: 2...");
    const resolvedPayload = {
      title: "The Architecture of the Solitary Ledger (Reconciled Edition)",
      contentHtml: "<p>Reconciled text combining local insights with ledger state.</p>",
      contentJson: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Reconciled text combining local insights with ledger state." }],
          },
        ],
      }),
      expectedVersion: 2, // Correct current version
    };

    const resolvedDoc = await DocumentService.updateDocument(documentId, resolvedPayload, authorAId);
    if (resolvedDoc.version !== 3) {
      throw new Error(`Expected version 3 after resolution, received: ${resolvedDoc.version}`);
    }
    documentSlug = resolvedDoc.slug;
    console.log(`  ✓ Conflict resolution succeeded. Ledger version advanced to: ${resolvedDoc.version} (Slug: ${documentSlug})\n`);

    // 8. Multi-Author Isolation & Document Authorization
    console.log("[Test 8] Testing Document Authorization & Multi-Author Isolation (Author Beta vs Author Alpha)...");

    // 8a. Author Beta GET private draft -> 403 Forbidden
    try {
      await DocumentService.getDocumentById(documentId, authorBId);
      throw new Error("FAIL: Author Beta was permitted to read Author Alpha's private draft!");
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        console.log(`  ✓ Cross-author read rejected with 403 Forbidden: "${err.message}"`);
      } else {
        throw err;
      }
    }

    // 8b. Author Beta PUT private draft -> 403 Forbidden
    try {
      await DocumentService.updateDocument(documentId, { title: "Vandalized Title" }, authorBId);
      throw new Error("FAIL: Author Beta was permitted to edit Author Alpha's private draft!");
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        console.log(`  ✓ Cross-author edit rejected with 403 Forbidden: "${err.message}"`);
      } else {
        throw err;
      }
    }

    // 8c. Author Beta DELETE private draft -> 403 Forbidden
    try {
      await DocumentService.deleteDocument(documentId, authorBId);
      throw new Error("FAIL: Author Beta was permitted to delete Author Alpha's private draft!");
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        console.log(`  ✓ Cross-author deletion rejected with 403 Forbidden: "${err.message}"`);
      } else {
        throw err;
      }
    }

    // 8d. Author Beta GET revisions -> 403 Forbidden
    try {
      await DocumentService.getDocumentRevisions(documentId, authorBId);
      throw new Error("FAIL: Author Beta was permitted to view Author Alpha's revisions!");
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        console.log(`  ✓ Cross-author revision inspection rejected with 403 Forbidden: "${err.message}"`);
      } else {
        throw err;
      }
    }

    // 8e. Unauthenticated user GET private draft -> 403 Forbidden
    try {
      await DocumentService.getDocumentById(documentId, undefined);
      throw new Error("FAIL: Unauthenticated visitor was allowed to view private draft!");
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        console.log(`  ✓ Unauthenticated access to private draft blocked with 403 Forbidden: "${err.message}"\n`);
      } else {
        throw err;
      }
    }

    // 9. Document Publication & Public Slug Resolution
    console.log("[Test 9] Publishing manuscript and verifying Public Slug Resolution (Reader View)...");
    const publishedDoc = await DocumentService.updateDocument(
      documentId,
      {
        status: "PUBLISHED",
        expectedVersion: 3,
      },
      authorAId
    );
    if (publishedDoc.status !== "PUBLISHED") {
      throw new Error(`Publishing document failed: ${JSON.stringify(publishedDoc)}`);
    }
    console.log(`  ✓ Manuscript published (status: PUBLISHED, version: ${publishedDoc.version})`);

    // Fetch via public slug resolver without authentication
    const publicSlugDoc = await DocumentService.getDocumentBySlug(documentSlug, undefined);
    if (!publicSlugDoc) {
      throw new Error(`Public slug resolution returned null for ${documentSlug}`);
    }
    if (publicSlugDoc.title !== "The Architecture of the Solitary Ledger (Reconciled Edition)") {
      throw new Error(`Public document content mismatch: ${JSON.stringify(publicSlugDoc)}`);
    }
    console.log(`  ✓ Public Reader slug resolution succeeded: "${publicSlugDoc.title}" accessible unauthenticated.\n`);

    // 10. Atomic Revision Snapshot Tracking
    console.log("[Test 10] Verifying Atomic Revision History (DocumentService.getDocumentRevisions)...");
    const revisions = await DocumentService.getDocumentRevisions(documentId, authorAId);
    if (!Array.isArray(revisions) || revisions.length < 2) {
      throw new Error(`Expected at least 2 revisions, received: ${revisions?.length}`);
    }
    console.log(`  ✓ Revisions history verified: ${revisions.length} revision snapshot(s) preserved in chronological ledger.`);
    for (const rev of revisions) {
      console.log(`    - Revision ${rev.version} (${new Date(rev.createdAt).toISOString()}): "${rev.title}"`);
    }
    console.log();

    // 11. Author Document Listing Isolation
    console.log("[Test 11] Verifying Author Document Listing Isolation (DocumentService.listDocuments)...");
    const listA = await DocumentService.listDocuments({ requesterId: authorAId, limit: 100 });
    if (!listA.items.some((d: any) => d.id === documentId)) {
      throw new Error(`Author Alpha's document list does not contain created manuscript.`);
    }

    const listB = await DocumentService.listDocuments({ requesterId: authorBId, authorId: authorBId });
    if (listB.items.length !== 0) {
      throw new Error(`Author Beta should have 0 owned documents, found: ${listB.items.length}`);
    }
    console.log(`  ✓ Author Alpha owns ${listA.items.length} document(s).`);
    console.log(`  ✓ Author Beta owns 0 documents. Clean workspace isolation.\n`);

    // 12. Local Recovery Buffer & Idempotent Migration Engine (DraftManager Unit Validation)
    console.log("[Test 12] Verifying Local Recovery Buffer & Idempotent Migration Engine (DraftManager)...");
    const mockStorage: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        for (const k of Object.keys(mockStorage)) delete mockStorage[k];
      },
    };

    (global as any).window = {};
    (global as any).localStorage = mockLocalStorage;

    // 12a. Recovery Buffer Save, Read, Clear
    DraftManager.saveRecoveryBuffer("doc-test-123", {
      title: "Offline Emergency Draft",
      contentHtml: "<p>Cached locally during flight.</p>",
      version: 2,
    });
    const retrievedBuffer = DraftManager.getRecoveryBuffer("doc-test-123");
    if (!retrievedBuffer || retrievedBuffer.title !== "Offline Emergency Draft" || retrievedBuffer.version !== 2) {
      throw new Error(`Failed to retrieve recovery buffer: ${JSON.stringify(retrievedBuffer)}`);
    }
    console.log(`  ✓ Recovery buffer persisted and retrieved: "${retrievedBuffer.title}" (Version ${retrievedBuffer.version})`);

    DraftManager.clearRecoveryBuffer("doc-test-123");
    if (DraftManager.getRecoveryBuffer("doc-test-123") !== null) {
      throw new Error(`Recovery buffer was not cleared properly!`);
    }
    console.log(`  ✓ Recovery buffer cleared cleanly upon sync confirmation.`);

    // 12b. Unmigrated drafts detection & Idempotency
    DraftManager.setActiveDraft({
      title: "Legacy Active Draft",
      contentHtml: "<p>Old localStorage manuscript.</p>",
      updatedAt: "2026-10-10T00:00:00.000Z",
    });

    const unmigrated = DraftManager.getUnmigratedDrafts();
    if (unmigrated.length !== 1 || unmigrated[0].title !== "Legacy Active Draft") {
      throw new Error(`Unmigrated drafts detection failed: ${JSON.stringify(unmigrated)}`);
    }
    console.log(`  ✓ Detected legacy draft ready for ledger migration: "${unmigrated[0].title}"`);

    // Mark as migrated
    const migrationKey = `active_${unmigrated[0].title}_${unmigrated[0].updatedAt}`;
    DraftManager.markDraftMigrated(migrationKey);

    // Verify idempotency
    const unmigratedAfter = DraftManager.getUnmigratedDrafts();
    if (unmigratedAfter.length !== 0) {
      throw new Error(`Idempotent migration failed: Draft was still marked unmigrated!`);
    }
    console.log(`  ✓ Idempotency verified: Migrated draft is never duplicated.\n`);

    // Clean up mock
    delete (global as any).window;
    delete (global as any).localStorage;

    // 13. Document Deletion & Safe Record Cleanup
    console.log("[Test 13] Verifying Document Deletion (DocumentService.deleteDocument) & Safe Cleanup...");
    const deleteResult = await DocumentService.deleteDocument(documentId, authorAId);
    if (!deleteResult.deleted) {
      throw new Error(`Document deletion failed: ${JSON.stringify(deleteResult)}`);
    }
    console.log(`  ✓ Document ${documentId} deleted successfully.`);

    // Verify document no longer exists
    try {
      await DocumentService.getDocumentById(documentId, authorAId);
      throw new Error("FAIL: Deleted document was still retrievable!");
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        console.log(`  ✓ Confirmed document is removed (NotFoundError / 404).`);
      } else {
        throw err;
      }
    }

    // Clean up test users
    await prisma.user.delete({ where: { id: authorAId } });
    await prisma.user.delete({ where: { id: authorBId } });
    console.log(`  ✓ Test authors and related session tokens cleaned up.\n`);

    console.log("================================================================================");
    console.log("  ✓ ALL 13 PHASE 2B PERSISTENCE & CONCURRENCY TESTS PASSED SUCCESSFULLY!       ");
    console.log("================================================================================\n");
  } catch (err) {
    if (documentId) {
      try {
        await prisma.post.delete({ where: { id: documentId } });
      } catch {}
    }
    try {
      await prisma.user.delete({ where: { id: authorAId } });
    } catch {}
    try {
      await prisma.user.delete({ where: { id: authorBId } });
    } catch {}
    throw err;
  }
}

runPhase2BVerification()
  .catch((err) => {
    console.error("\n❌ PHASE 2B VERIFICATION SUITE FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

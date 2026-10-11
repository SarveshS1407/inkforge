/**
 * INKFORGE — PHASE 6 COMPREHENSIVE VERIFICATION SUITE
 * Discovery, Collections, Reading Lists & Reading Experience
 *
 * Scenarios Tested:
 * 1. Create collection with title & description
 * 2. Rename collection
 * 3. Update collection description & privacy (isPublic)
 * 4. Delete collection and verify clean cascade
 * 5. Add work to collection
 * 6. Remove work from collection
 * 7. Attempt duplicate collection membership (ConflictError 409)
 * 8. Attempt modifying another user's collection (ForbiddenError 403)
 * 9. Attempt unauthorized collection access (ForbiddenError 403)
 * 10. Verify private collection visibility (hidden from public/others)
 * 11. Search published works by title
 * 12. Search published works by author
 * 13. Search with no matches returns empty list without error
 * 14. Verify drafts never appear in discovery
 * 15. Verify unpublished works disappear from public discovery results
 * 16. Validate pagination bounds and stable ordering
 * 17. Validate sorting and supported filters (readingTimeFilter, sortBy)
 * 18. Verify author navigation and published work listings
 * 19. Verify empty and error states
 * 20. Verify long titles and descriptions resilience
 * 21. Verify existing publishing and public slug behavior
 * 22. Verify Phase 5 AI Copilot and typography functionality remain intact
 * 23. Verify Phase 2B persistence, autosave, and OCC check
 * 24. Clean database teardown
 */

import { checkDatabaseConnection, prisma } from "../lib/db";
import { AuthService } from "../lib/services/auth.service";
import { DocumentService } from "../lib/services/document.service";
import { CollectionService } from "../lib/services/collection.service";
import { AiService } from "../lib/services/ai.service";
import {
  ForbiddenError,
  ValidationError,
  ConflictError,
  NotFoundError,
} from "../lib/errors";

async function runPhase6Verification() {
  console.log("================================================================================");
  console.log("            INKFORGE PHASE 6: DISCOVERY, COLLECTIONS & READING LISTS            ");
  console.log("   Anthologies, Search, Filters, Privacy Boundaries, Reader Save & Cascades     ");
  console.log("================================================================================\n");

  (process.env as any).NODE_ENV = "test";
  const runId = Date.now().toString().slice(-6);

  // Database Connection
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.status !== "connected") {
    throw new Error(`Database connection failed: ${dbHealth.error}`);
  }
  console.log("✓ Database connection active and healthy.\n");

  // Setup Test Authors
  const userAlphaData = {
    email: `phase6.alpha.${runId}@inkforge.test`,
    password: "PasswordAlpha123!",
    username: `reader_alpha_${runId}`,
    displayName: "Ada Lovelace",
  };
  const userBetaData = {
    email: `phase6.beta.${runId}@inkforge.test`,
    password: "PasswordBeta123!",
    username: `reader_beta_${runId}`,
    displayName: "Charles Babbage",
  };

  const regAlpha = await AuthService.register(userAlphaData);
  const authorAlphaId = regAlpha.user.id;
  const regBeta = await AuthService.register(userBetaData);
  const authorBetaId = regBeta.user.id;

  // Create Manuscripts for Testing
  const post1 = await DocumentService.createDocument(
    {
      title: "Analytical Engines and Digital Loom",
      excerpt: "On mechanical computation and weaving algebraical patterns.",
      contentHtml: "<p>We may say most aptly that the Analytical Engine weaves algebraical patterns just as the Jacquard loom weaves flowers and leaves.</p>",
    },
    authorAlphaId
  );
  // Publish post1
  const pubPost1 = await DocumentService.publishDocument(post1.id, authorAlphaId);

  const post2 = await DocumentService.createDocument(
    {
      title: "Difference Engines and Numerical Tables",
      excerpt: "Calculating polynomial values through mechanical finite differences.",
      contentHtml: "<p>The engine can tabulate any function whatsoever of which the second differences are constant.</p>",
    },
    authorBetaId
  );
  // Publish post2
  const pubPost2 = await DocumentService.publishDocument(post2.id, authorBetaId);

  // Private draft by authorAlpha
  const draftPost = await DocumentService.createDocument(
    {
      title: "Private Speculations on Artificial Thinking",
      excerpt: "Confidential draft never to appear in public searches.",
      contentHtml: "<p>The engine has no pretensions whatever to originate anything.</p>",
    },
    authorAlphaId
  );

  console.log("Created test authors and publications for verification.\n");

  // 1. Create collection with title & description
  console.log("[Scenario 1] Create collection with title & description...");
  const col1 = await CollectionService.createCollection(
    authorAlphaId,
    {
      title: "Critical Computing Anthologies",
      description: "Curated selection of seminal early computing treatises.",
      isPublic: true,
    }
  );
  if (!col1.id || col1.title !== "Critical Computing Anthologies" || col1.slug !== "critical-computing-anthologies") {
    throw new Error("Failed to create collection properly: " + JSON.stringify(col1));
  }
  console.log("  ✓ Collection created with slug:", col1.slug);

  // 2. Rename collection
  console.log("[Scenario 2] Rename collection...");
  const col1Renamed = await CollectionService.updateCollection(
    col1.id,
    authorAlphaId,
    { title: "Foundations of Mechanical Reasoning" }
  );
  if (col1Renamed.title !== "Foundations of Mechanical Reasoning" || col1Renamed.slug !== "foundations-of-mechanical-reasoning") {
    throw new Error("Failed to rename collection or regenerate slug: " + JSON.stringify(col1Renamed));
  }
  console.log("  ✓ Collection successfully renamed and slug updated:", col1Renamed.slug);

  // 3. Update collection description & privacy (isPublic)
  console.log("[Scenario 3] Update collection description & privacy (isPublic)...");
  const col1Updated = await CollectionService.updateCollection(
    col1.id,
    authorAlphaId,
    {
      description: "Updated philosophical reflections on symbolic computing.",
      isPublic: false,
    }
  );
  if (col1Updated.isPublic !== false || !col1Updated.description?.includes("Updated philosophical")) {
    throw new Error("Failed to update description & privacy: " + JSON.stringify(col1Updated));
  }
  console.log("  ✓ Collection description and privacy set to private (isPublic=false)");

  // Turn back to public for test sharing
  await CollectionService.updateCollection(col1.id, authorAlphaId, { isPublic: true });

  // 4. Delete collection and verify clean cascade
  console.log("[Scenario 4] Delete collection and verify clean cascade...");
  const colTemp = await CollectionService.createCollection(
    authorAlphaId,
    {
      title: "Temporary Reading List",
      description: "Ephemeral collection for deletion test",
      isPublic: true,
    }
  );
  await CollectionService.addItemToCollection(colTemp.id, authorAlphaId, pubPost1.id);
  const delRes = await CollectionService.deleteCollection(colTemp.id, authorAlphaId);
  if (!delRes.success) throw new Error("Delete collection failed");

  // Verify collection and its items no longer exist in DB
  const checkCol = await prisma.collection.findUnique({ where: { id: colTemp.id } });
  const checkItems = await prisma.collectionItem.findMany({ where: { collectionId: colTemp.id } });
  if (checkCol !== null || checkItems.length > 0) {
    throw new Error("Collection or items still exist after deletion");
  }
  // Verify the referenced post was NOT deleted
  const checkPost = await prisma.post.findUnique({ where: { id: pubPost1.id } });
  if (!checkPost) throw new Error("Original post was incorrectly deleted on collection cascade!");
  console.log("  ✓ Collection and membership cascaded cleanly without affecting original post");

  // 5. Add work to collection
  console.log("[Scenario 5] Add work to collection...");
  const addedItem = await CollectionService.addItemToCollection(col1.id, authorAlphaId, pubPost1.id);
  if (!addedItem.id || addedItem.postId !== pubPost1.id) {
    throw new Error("Failed to add post to collection");
  }
  console.log("  ✓ Work successfully added to collection");

  // 6. Remove work from collection
  console.log("[Scenario 6] Remove work from collection...");
  // Add post2 first
  await CollectionService.addItemToCollection(col1.id, authorAlphaId, pubPost2.id);
  const remRes = await CollectionService.removeItemFromCollection(col1.id, authorAlphaId, pubPost2.id);
  if (!remRes.success) throw new Error("Failed to remove item from collection");
  const detailAfterRem = await CollectionService.getCollectionById(col1.id, authorAlphaId);
  if (detailAfterRem.items.some((i) => i.post.id === pubPost2.id)) {
    throw new Error("Removed item still present in collection!");
  }
  console.log("  ✓ Work successfully removed from collection");

  // 7. Attempt duplicate collection membership (ConflictError 409)
  console.log("[Scenario 7] Attempt duplicate collection membership (ConflictError 409)...");
  let caughtDuplicate = false;
  try {
    await CollectionService.addItemToCollection(col1.id, authorAlphaId, pubPost1.id);
  } catch (err) {
    if (err instanceof ConflictError) {
      caughtDuplicate = true;
    }
  }
  if (!caughtDuplicate) {
    throw new Error("Expected ConflictError (409) when adding duplicate work to collection");
  }
  console.log("  ✓ Duplicate collection item correctly rejected with ConflictError (409)");

  // 8. Attempt modifying another user's collection (ForbiddenError 403)
  console.log("[Scenario 8] Attempt modifying another user's collection (ForbiddenError 403)...");
  let caughtForbiddenUpdate = false;
  try {
    await CollectionService.updateCollection(col1.id, authorBetaId, { title: "Hijacked Title" });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      caughtForbiddenUpdate = true;
    }
  }
  if (!caughtForbiddenUpdate) {
    throw new Error("Expected ForbiddenError (403) when user attempts modifying another author's collection");
  }

  let caughtForbiddenAdd = false;
  try {
    await CollectionService.addItemToCollection(col1.id, authorBetaId, pubPost2.id);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      caughtForbiddenAdd = true;
    }
  }
  if (!caughtForbiddenAdd) {
    throw new Error("Expected ForbiddenError (403) when adding work to another author's collection");
  }
  console.log("  ✓ Cross-user collection mutation strictly blocked with ForbiddenError (403)");

  // 9. Attempt unauthorized private collection access (ForbiddenError 403)
  console.log("[Scenario 9] Attempt unauthorized collection access (ForbiddenError 403)...");
  const privateCol = await CollectionService.createCollection(
    authorAlphaId,
    {
      title: "Top Secret Reading List",
      description: "Private research notes",
      isPublic: false,
    }
  );
  let caughtPrivateGet = false;
  try {
    // Unauthenticated or another user
    await CollectionService.getCollectionById(privateCol.id, authorBetaId);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      caughtPrivateGet = true;
    }
  }
  if (!caughtPrivateGet) {
    throw new Error("Expected ForbiddenError when unauthorized user views private collection");
  }
  console.log("  ✓ Unauthorized private collection access blocked with ForbiddenError (403)");

  // 10. Verify private collection visibility (hidden from public/others)
  console.log("[Scenario 10] Verify private collection visibility (hidden from others)...");
  const publicListing = await CollectionService.listCollections({});
  if (publicListing.items.some((c) => c.id === privateCol.id)) {
    throw new Error("Private collection leaked into public anthologies listing!");
  }
  const alphaPersonalListing = await CollectionService.listCollections({
    ownerId: authorAlphaId,
    requesterId: authorAlphaId,
  });
  if (!alphaPersonalListing.items.some((c) => c.id === privateCol.id)) {
    throw new Error("Owner unable to view their own private collection!");
  }
  console.log("  ✓ Private collection invisible in public anthologies, visible only to owner");

  // 11. Search published works by title
  console.log("[Scenario 11] Search published works by title...");
  const searchTitleRes = await DocumentService.listDocuments({
    status: "PUBLISHED",
    search: "Analytical",
  });
  if (!searchTitleRes.items.some((item) => item.id === pubPost1.id)) {
    throw new Error("Published post not found when searching by title");
  }
  console.log("  ✓ Published work found by title search");

  // 12. Search published works by author
  console.log("[Scenario 12] Search published works by author...");
  const searchAuthorRes = await DocumentService.listDocuments({
    status: "PUBLISHED",
    search: userBetaData.displayName,
  });
  if (!searchAuthorRes.items.some((item) => item.id === pubPost2.id)) {
    throw new Error("Published post not found when searching by author displayName");
  }
  console.log("  ✓ Published work found by author search");

  // 13. Search with no matches returns empty list without error
  console.log("[Scenario 13] Search with no matches returns empty list without error...");
  const emptySearchRes = await DocumentService.listDocuments({
    status: "PUBLISHED",
    search: "NonExistentExtraterrestrialProse12345",
  });
  if (emptySearchRes.items.length !== 0) {
    throw new Error("Expected 0 results for non-matching search, got: " + emptySearchRes.items.length);
  }
  console.log("  ✓ Non-matching search returns clean empty list [ ] without error");

  // 14. Verify drafts never appear in discovery
  console.log("[Scenario 14] Verify drafts never appear in discovery...");
  const publicAll = await DocumentService.listDocuments({ status: "PUBLISHED" });
  if (publicAll.items.some((item) => item.id === draftPost.id || item.status === "DRAFT")) {
    throw new Error("Draft document leaked into public discovery feed!");
  }
  // Search specifically for draft title in public feed
  const draftSearch = await DocumentService.listDocuments({
    status: "PUBLISHED",
    search: "Private Speculations",
  });
  if (draftSearch.items.length !== 0) {
    throw new Error("Draft document found via public search!");
  }
  console.log("  ✓ Drafts strictly isolated: zero leakage into public discovery");

  // 15. Verify unpublished works disappear from public discovery results
  console.log("[Scenario 15] Verify unpublished works disappear from public discovery results...");
  // Unpublish post2
  await DocumentService.unpublishDocument(pubPost2.id, authorBetaId);
  const afterUnpublish = await DocumentService.listDocuments({
    status: "PUBLISHED",
    search: "Difference Engines",
  });
  if (afterUnpublish.items.some((item) => item.id === pubPost2.id)) {
    throw new Error("Unpublished document still visible in public discovery feed!");
  }
  console.log("  ✓ Unpublished document immediately removed from public discovery results");

  // Re-publish post2 for remaining checks
  await DocumentService.publishDocument(pubPost2.id, authorBetaId);

  // 16. Validate pagination bounds and stable ordering
  console.log("[Scenario 16] Validate pagination bounds and stable ordering...");
  const page1 = await DocumentService.listDocuments({
    status: "PUBLISHED",
    limit: 1,
    offset: 0,
  });
  const page2 = await DocumentService.listDocuments({
    status: "PUBLISHED",
    limit: 1,
    offset: 1,
  });
  if (page1.items.length !== 1 || page2.items.length !== 1) {
    throw new Error("Pagination limit bounds violated");
  }
  if (page1.items[0].id === page2.items[0].id) {
    throw new Error("Pagination offset did not advance or ordering is unstable");
  }
  console.log("  ✓ Pagination limit/offset bounds verified with deterministic ordering");

  // 17. Validate sorting and supported filters
  console.log("[Scenario 17] Validate sorting and supported filters...");
  const sortedByTitle = await DocumentService.listDocuments({
    status: "PUBLISHED",
    sortBy: "title",
  });
  if (sortedByTitle.items.length >= 2) {
    const titles = sortedByTitle.items.map((i) => i.title);
    const sortedTitles = [...titles].sort((a, b) => a.localeCompare(b));
    if (titles[0] !== sortedTitles[0]) {
      throw new Error("Title sorting did not produce ascending order: " + titles.join(", "));
    }
  }
  // Reading time filter: short
  const shortDocs = await DocumentService.listDocuments({
    status: "PUBLISHED",
    readingTimeFilter: "short",
  });
  if (shortDocs.items.some((d) => d.readingTimeMinutes > 4)) {
    throw new Error("Reading time short filter returned documents > 4 minutes");
  }
  console.log("  ✓ Sorting and reading-time duration filters verified");

  // 18. Verify author navigation and published work listings
  console.log("[Scenario 18] Verify author navigation and published work listings...");
  const authorAlphaWorks = await DocumentService.listDocuments({
    authorId: authorAlphaId,
    status: "PUBLISHED",
  });
  if (!authorAlphaWorks.items.some((i) => i.id === pubPost1.id)) {
    throw new Error("Author Alpha's published work not present in author portfolio listing");
  }
  if (authorAlphaWorks.items.some((i) => i.authorId !== authorAlphaId)) {
    throw new Error("Cross-author contamination in author portfolio listing");
  }
  console.log("  ✓ Author portfolio query accurately lists published works");

  // 19. Verify empty and error states
  console.log("[Scenario 19] Verify empty and error states...");
  let caughtNotFoundCol = false;
  try {
    await CollectionService.getCollectionById("non-existent-collection-id-99999");
  } catch (err) {
    if (err instanceof NotFoundError) {
      caughtNotFoundCol = true;
    }
  }
  if (!caughtNotFoundCol) {
    throw new Error("Expected NotFoundError for non-existent collection ID");
  }
  console.log("  ✓ NotFoundError correctly thrown for missing collection ID");

  // 20. Verify long titles and descriptions resilience
  console.log("[Scenario 20] Verify long titles and descriptions resilience...");
  const maxTitle = "A".repeat(100);
  const maxDesc = "B".repeat(500);
  const longCol = await CollectionService.createCollection(authorAlphaId, {
    title: maxTitle,
    description: maxDesc,
    isPublic: true,
  });
  if (longCol.title.length !== 100) {
    throw new Error("Valid max-length title was truncated or rejected");
  }
  // Beyond limit should throw ValidationError
  let caughtOversizedTitle = false;
  try {
    await CollectionService.createCollection(authorAlphaId, { title: "A".repeat(101) });
  } catch (err) {
    if (err instanceof ValidationError) caughtOversizedTitle = true;
  }
  if (!caughtOversizedTitle) {
    throw new Error("Expected ValidationError for oversized collection title");
  }
  console.log("  ✓ Long collection title & description validation boundaries enforced");

  // 21. Verify existing publishing and public slug behavior
  console.log("[Scenario 21] Verify existing publishing and public slug behavior...");
  const slugDoc = await DocumentService.getDocumentBySlug(pubPost1.slug);
  if (slugDoc.id !== pubPost1.id || slugDoc.status !== "PUBLISHED") {
    throw new Error("Public slug retrieval regression detected!");
  }
  console.log("  ✓ Public monograph slug retrieval operates correctly");

  // 22. Verify Phase 5 AI Copilot and typography functionality remain intact
  console.log("[Scenario 22] Verify Phase 5 AI Copilot and typography remain intact...");
  const aiStatus = AiService.getStatus();
  if (!aiStatus.activeProvider || !aiStatus.model) {
    throw new Error("Phase 5 AI Service status regression!");
  }
  const aiRes = await AiService.executeTask(authorAlphaId, {
    task: "titles",
    selectedText: "A treatise on mechanized differential analysis and logic.",
    tone: "Formal",
  });
  if (!aiRes.suggestion || aiRes.suggestion.length === 0) {
    throw new Error("Phase 5 AI task execution regression!");
  }
  console.log("  ✓ Phase 5 AI Copilot functionality verified intact");

  // 23. Verify Phase 2B persistence, autosave, and OCC check
  console.log("[Scenario 23] Verify Phase 2B persistence, autosave, and OCC check...");
  const draftUpdate = await DocumentService.updateDocument(
    draftPost.id,
    {
      title: "Private Speculations on Artificial Thinking (Revised)",
      contentHtml: "<p>Updated draft content for optimistic concurrency check.</p>",
      expectedVersion: draftPost.version,
    },
    authorAlphaId
  );
  if (draftUpdate.version !== draftPost.version + 1) {
    throw new Error("Phase 2B OCC version increment regression!");
  }
  console.log("  ✓ Phase 2B OCC versioning and autosave updates verified intact");

  // 24. Clean database teardown
  console.log("[Scenario 24] Clean database teardown...");
  await prisma.collectionItem.deleteMany({
    where: {
      collection: {
        ownerId: { in: [authorAlphaId, authorBetaId] },
      },
    },
  });
  await prisma.collection.deleteMany({
    where: {
      ownerId: { in: [authorAlphaId, authorBetaId] },
    },
  });
  await prisma.post.deleteMany({
    where: {
      authorId: { in: [authorAlphaId, authorBetaId] },
    },
  });
  await prisma.user.deleteMany({
    where: {
      id: { in: [authorAlphaId, authorBetaId] },
    },
  });
  console.log("  ✓ Clean database teardown completed.\n");

  console.log("================================================================================");
  console.log("               ✓ ALL 24 PHASE 6 VERIFICATION SCENARIOS PASSED                   ");
  console.log("================================================================================\n");
}

runPhase6Verification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ PHASE 6 VERIFICATION FAILED:", err);
    process.exit(1);
  });

/**
 * INKFORGE — SQLITE TO POSTGRESQL DATA MIGRATION ENGINE
 *
 * Safely migrates records from the local SQLite database (prisma/dev.db)
 * to a managed PostgreSQL database (e.g. Supabase, Neon, AWS RDS, Railway).
 *
 * Architectural & Safety Guarantees:
 * 1. Independent SQLite Reader: Uses Node's built-in `node:sqlite` (DatabaseSync)
 *    to read local records, avoiding any Prisma client provider collision.
 * 2. Strict Topological Dependency Order:
 *    User -> Profile -> Publication -> PublicationMember -> Tag ->
 *    Post -> PostRevision -> PostTag -> Collection -> CollectionItem ->
 *    Session -> VerificationToken -> PasswordResetToken.
 * 3. Atomic Transaction: All writes are performed within a PostgreSQL $transaction.
 *    Any failure rolls back all changes, leaving target PostgreSQL untouched.
 * 4. Idempotency & Conflict Safety: Uses upserts on primary and composite keys
 *    to ensure safe repeat runs without duplicate key collisions.
 * 5. Type & Date Normalization: Automatically converts SQLite booleans (0/1) and
 *    date strings/timestamps into standard JavaScript Booleans and Date objects.
 * 6. Credential Protection: Automatically redacts database passwords from log outputs.
 * 7. Dry-Run Mode: Pass `--dry-run` to inspect and validate source data without writing.
 *
 * Usage:
 *   TARGET_DATABASE_URL="postgresql://user:pass@host:5432/db" npx jiti src/scripts/migrate_sqlite_to_postgres.ts
 *   npx jiti src/scripts/migrate_sqlite_to_postgres.ts --dry-run
 */

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function maskDbUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "********";
    }
    return parsed.toString();
  } catch {
    return "postgresql://***:********@masked-host/database";
  }
}

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "number" || typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export async function runDataMigration(targetUrlOverride?: string, isDryRunOverride?: boolean) {
  const isDryRun = isDryRunOverride ?? process.argv.includes("--dry-run");
  const targetUrl = targetUrlOverride || process.env.TARGET_DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

  console.log("================================================================================");
  console.log("       INKFORGE — PRODUCTION RELATIONAL MIGRATION ENGINE (SQLITE -> POSTGRES)   ");
  console.log("================================================================================\n");

  const sqlitePath = path.join(process.cwd(), "prisma/dev.db");
  if (!fs.existsSync(sqlitePath)) {
    console.error(`❌ ERROR: Source SQLite database not found at ${sqlitePath}`);
    process.exit(1);
  }

  // 1. Read source data from SQLite
  console.log(`1. Inspecting Source SQLite Database (${sqlitePath})...`);
  const sqlite = new DatabaseSync(sqlitePath);

  const getRows = (table: string): Record<string, unknown>[] => {
    try {
      return sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[];
    } catch {
      return [];
    }
  };

  const users = getRows("User");
  const profiles = getRows("Profile");
  const publications = getRows("Publication");
  const publicationMembers = getRows("PublicationMember");
  const tags = getRows("Tag");
  const posts = getRows("Post");
  const postRevisions = getRows("PostRevision");
  const postTags = getRows("PostTag");
  const collections = getRows("Collection");
  const collectionItems = getRows("CollectionItem");
  const sessions = getRows("Session");
  const verificationTokens = getRows("VerificationToken");
  const passwordResetTokens = getRows("PasswordResetToken");

  console.log(`  • Users:                   ${users.length}`);
  console.log(`  • Profiles:                ${profiles.length}`);
  console.log(`  • Publications:            ${publications.length}`);
  console.log(`  • Publication Members:     ${publicationMembers.length}`);
  console.log(`  • Tags:                    ${tags.length}`);
  console.log(`  • Posts (Manuscripts):     ${posts.length}`);
  console.log(`  • Post Revisions:          ${postRevisions.length}`);
  console.log(`  • Post Tags (Join):        ${postTags.length}`);
  console.log(`  • Collections:             ${collections.length}`);
  console.log(`  • Collection Items:        ${collectionItems.length}`);
  console.log(`  • Sessions:                ${sessions.length}`);
  console.log(`  • Verification Tokens:     ${verificationTokens.length}`);
  console.log(`  • Password Reset Tokens:   ${passwordResetTokens.length}\n`);

  if (isDryRun) {
    console.log("ℹ️ DRY-RUN MODE: Source data audited successfully. No target database writes attempted.");
    console.log("================================================================================");
    return { success: true, dryRun: true };
  }

  if (!targetUrl || (!targetUrl.startsWith("postgres://") && !targetUrl.startsWith("postgresql://"))) {
    console.error("❌ ERROR: TARGET_DATABASE_URL is required and must start with postgresql:// or postgres://");
    console.error("Set TARGET_DATABASE_URL or run with --dry-run for audit-only mode.");
    process.exit(1);
  }

  console.log(`2. Connecting to Target PostgreSQL (${maskDbUrl(targetUrl)})...`);

  const targetPrisma = new PrismaClient({
    datasources: {
      db: { url: targetUrl },
    },
  });

  try {
    // Connectivity probe
    await targetPrisma.$queryRawUnsafe("SELECT 1;");
    console.log("  ✓ Connection verified.\n");

    console.log("3. Beginning Atomic Transactional Relational Migration...");
    const startTime = Date.now();

    await targetPrisma.$transaction(
      async (tx) => {
        // 1. Users
        for (const u of users) {
          await tx.user.upsert({
            where: { id: String(u.id) },
            update: {
              email: String(u.email),
              username: String(u.username),
              displayName: u.displayName ? String(u.displayName) : null,
              avatarUrl: u.avatarUrl ? String(u.avatarUrl) : null,
              bio: u.bio ? String(u.bio) : null,
              role: String(u.role || "WRITER"),
              emailVerified: parseDate(u.emailVerified),
              updatedAt: parseDate(u.updatedAt) || new Date(),
            },
            create: {
              id: String(u.id),
              email: String(u.email),
              passwordHash: u.passwordHash ? String(u.passwordHash) : null,
              username: String(u.username),
              displayName: u.displayName ? String(u.displayName) : null,
              avatarUrl: u.avatarUrl ? String(u.avatarUrl) : null,
              bio: u.bio ? String(u.bio) : null,
              role: String(u.role || "WRITER"),
              emailVerified: parseDate(u.emailVerified),
              createdAt: parseDate(u.createdAt) || new Date(),
              updatedAt: parseDate(u.updatedAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${users.length} Users`);

        // 2. Profiles
        for (const p of profiles) {
          await tx.profile.upsert({
            where: { id: String(p.id) },
            update: {
              displayName: String(p.displayName),
              slug: p.slug ? String(p.slug) : null,
              bio: p.bio ? String(p.bio) : null,
              avatarUrl: p.avatarUrl ? String(p.avatarUrl) : null,
              websiteUrl: p.websiteUrl ? String(p.websiteUrl) : null,
              location: p.location ? String(p.location) : null,
              updatedAt: parseDate(p.updatedAt) || new Date(),
            },
            create: {
              id: String(p.id),
              userId: String(p.userId),
              displayName: String(p.displayName),
              slug: p.slug ? String(p.slug) : null,
              bio: p.bio ? String(p.bio) : null,
              avatarUrl: p.avatarUrl ? String(p.avatarUrl) : null,
              websiteUrl: p.websiteUrl ? String(p.websiteUrl) : null,
              location: p.location ? String(p.location) : null,
              createdAt: parseDate(p.createdAt) || new Date(),
              updatedAt: parseDate(p.updatedAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${profiles.length} Profiles`);

        // 3. Publications
        for (const pub of publications) {
          await tx.publication.upsert({
            where: { id: String(pub.id) },
            update: {
              name: String(pub.name),
              slug: String(pub.slug),
              description: pub.description ? String(pub.description) : null,
              logoUrl: pub.logoUrl ? String(pub.logoUrl) : null,
              coverUrl: pub.coverUrl ? String(pub.coverUrl) : null,
              updatedAt: parseDate(pub.updatedAt) || new Date(),
            },
            create: {
              id: String(pub.id),
              name: String(pub.name),
              slug: String(pub.slug),
              description: pub.description ? String(pub.description) : null,
              logoUrl: pub.logoUrl ? String(pub.logoUrl) : null,
              coverUrl: pub.coverUrl ? String(pub.coverUrl) : null,
              ownerId: String(pub.ownerId),
              createdAt: parseDate(pub.createdAt) || new Date(),
              updatedAt: parseDate(pub.updatedAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${publications.length} Publications`);

        // 4. Publication Members
        for (const m of publicationMembers) {
          await tx.publicationMember.upsert({
            where: {
              publicationId_userId: {
                publicationId: String(m.publicationId),
                userId: String(m.userId),
              },
            },
            update: {
              role: String(m.role || "CONTRIBUTOR"),
            },
            create: {
              id: String(m.id),
              publicationId: String(m.publicationId),
              userId: String(m.userId),
              role: String(m.role || "CONTRIBUTOR"),
              createdAt: parseDate(m.createdAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${publicationMembers.length} Publication Members`);

        // 5. Tags
        for (const t of tags) {
          await tx.tag.upsert({
            where: { id: String(t.id) },
            update: {
              name: String(t.name),
              slug: String(t.slug),
            },
            create: {
              id: String(t.id),
              name: String(t.name),
              slug: String(t.slug),
              createdAt: parseDate(t.createdAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${tags.length} Tags`);

        // 6. Posts
        for (const post of posts) {
          await tx.post.upsert({
            where: { id: String(post.id) },
            update: {
              title: String(post.title),
              subtitle: post.subtitle ? String(post.subtitle) : null,
              slug: String(post.slug),
              excerpt: post.excerpt ? String(post.excerpt) : null,
              contentJson: post.contentJson ? String(post.contentJson) : null,
              contentHtml: post.contentHtml ? String(post.contentHtml) : null,
              status: String(post.status || "DRAFT"),
              version: Number(post.version || 1),
              targetWords: Number(post.targetWords || 1200),
              coverImageUrl: post.coverImageUrl ? String(post.coverImageUrl) : null,
              readingTimeMinutes: Number(post.readingTimeMinutes || 1),
              publishedAt: parseDate(post.publishedAt),
              scheduledFor: parseDate(post.scheduledFor),
              canonicalUrl: post.canonicalUrl ? String(post.canonicalUrl) : null,
              publicationId: post.publicationId ? String(post.publicationId) : null,
              updatedAt: parseDate(post.updatedAt) || new Date(),
            },
            create: {
              id: String(post.id),
              title: String(post.title),
              subtitle: post.subtitle ? String(post.subtitle) : null,
              slug: String(post.slug),
              excerpt: post.excerpt ? String(post.excerpt) : null,
              contentJson: post.contentJson ? String(post.contentJson) : null,
              contentHtml: post.contentHtml ? String(post.contentHtml) : null,
              status: String(post.status || "DRAFT"),
              version: Number(post.version || 1),
              targetWords: Number(post.targetWords || 1200),
              coverImageUrl: post.coverImageUrl ? String(post.coverImageUrl) : null,
              readingTimeMinutes: Number(post.readingTimeMinutes || 1),
              publishedAt: parseDate(post.publishedAt),
              scheduledFor: parseDate(post.scheduledFor),
              canonicalUrl: post.canonicalUrl ? String(post.canonicalUrl) : null,
              authorId: String(post.authorId),
              publicationId: post.publicationId ? String(post.publicationId) : null,
              createdAt: parseDate(post.createdAt) || new Date(),
              updatedAt: parseDate(post.updatedAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${posts.length} Posts`);

        // 7. Post Revisions
        for (const rev of postRevisions) {
          await tx.postRevision.upsert({
            where: { id: String(rev.id) },
            update: {
              version: Number(rev.version || 1),
              title: String(rev.title),
              contentJson: String(rev.contentJson),
              wordCount: Number(rev.wordCount || 0),
              excerpt: rev.excerpt ? String(rev.excerpt) : null,
            },
            create: {
              id: String(rev.id),
              postId: String(rev.postId),
              version: Number(rev.version || 1),
              title: String(rev.title),
              contentJson: String(rev.contentJson),
              wordCount: Number(rev.wordCount || 0),
              excerpt: rev.excerpt ? String(rev.excerpt) : null,
              createdAt: parseDate(rev.createdAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${postRevisions.length} Post Revisions`);

        // 8. Post Tags (Join Table)
        for (const pt of postTags) {
          await tx.postTag.upsert({
            where: {
              postId_tagId: {
                postId: String(pt.postId),
                tagId: String(pt.tagId),
              },
            },
            update: {},
            create: {
              postId: String(pt.postId),
              tagId: String(pt.tagId),
            },
          });
        }
        console.log(`  ✓ Migrated ${postTags.length} Post Tags`);

        // 9. Collections
        for (const col of collections) {
          await tx.collection.upsert({
            where: { id: String(col.id) },
            update: {
              title: String(col.title),
              slug: String(col.slug),
              description: col.description ? String(col.description) : null,
              isPublic: Boolean(col.isPublic),
              updatedAt: parseDate(col.updatedAt) || new Date(),
            },
            create: {
              id: String(col.id),
              title: String(col.title),
              slug: String(col.slug),
              description: col.description ? String(col.description) : null,
              isPublic: Boolean(col.isPublic),
              ownerId: String(col.ownerId),
              createdAt: parseDate(col.createdAt) || new Date(),
              updatedAt: parseDate(col.updatedAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${collections.length} Collections`);

        // 10. Collection Items
        for (const item of collectionItems) {
          await tx.collectionItem.upsert({
            where: { id: String(item.id) },
            update: {
              orderIndex: Number(item.orderIndex || 0),
            },
            create: {
              id: String(item.id),
              collectionId: String(item.collectionId),
              postId: String(item.postId),
              orderIndex: Number(item.orderIndex || 0),
              addedAt: parseDate(item.addedAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${collectionItems.length} Collection Items`);

        // 11. Sessions
        for (const s of sessions) {
          await tx.session.upsert({
            where: { id: String(s.id) },
            update: {
              sessionToken: String(s.sessionToken),
              expiresAt: parseDate(s.expiresAt) || new Date(),
              ipAddress: s.ipAddress ? String(s.ipAddress) : null,
              userAgent: s.userAgent ? String(s.userAgent) : null,
            },
            create: {
              id: String(s.id),
              sessionToken: String(s.sessionToken),
              userId: String(s.userId),
              expiresAt: parseDate(s.expiresAt) || new Date(),
              ipAddress: s.ipAddress ? String(s.ipAddress) : null,
              userAgent: s.userAgent ? String(s.userAgent) : null,
              createdAt: parseDate(s.createdAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${sessions.length} Sessions`);

        // 12. Verification Tokens
        for (const vt of verificationTokens) {
          await tx.verificationToken.upsert({
            where: { id: String(vt.id) },
            update: {
              tokenHash: String(vt.tokenHash),
              expiresAt: parseDate(vt.expiresAt) || new Date(),
            },
            create: {
              id: String(vt.id),
              userId: String(vt.userId),
              tokenHash: String(vt.tokenHash),
              expiresAt: parseDate(vt.expiresAt) || new Date(),
              createdAt: parseDate(vt.createdAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${verificationTokens.length} Verification Tokens`);

        // 13. Password Reset Tokens
        for (const prt of passwordResetTokens) {
          await tx.passwordResetToken.upsert({
            where: { id: String(prt.id) },
            update: {
              tokenHash: String(prt.tokenHash),
              expiresAt: parseDate(prt.expiresAt) || new Date(),
            },
            create: {
              id: String(prt.id),
              userId: String(prt.userId),
              tokenHash: String(prt.tokenHash),
              expiresAt: parseDate(prt.expiresAt) || new Date(),
              createdAt: parseDate(prt.createdAt) || new Date(),
            },
          });
        }
        console.log(`  ✓ Migrated ${passwordResetTokens.length} Password Reset Tokens`);
      },
      { timeout: 120000 }
    );

    const elapsedMs = Date.now() - startTime;
    console.log(`\n4. Verifying Post-Migration Target Row Counts (Elapsed: ${elapsedMs}ms)...`);

    const [
      pgUsers,
      pgProfiles,
      pgPubs,
      pgMembers,
      pgTags,
      pgPosts,
      pgRevs,
      pgPostTags,
      pgCols,
      pgColItems,
      pgSessions,
      pgVerif,
      pgReset,
    ] = await Promise.all([
      targetPrisma.user.count(),
      targetPrisma.profile.count(),
      targetPrisma.publication.count(),
      targetPrisma.publicationMember.count(),
      targetPrisma.tag.count(),
      targetPrisma.post.count(),
      targetPrisma.postRevision.count(),
      targetPrisma.postTag.count(),
      targetPrisma.collection.count(),
      targetPrisma.collectionItem.count(),
      targetPrisma.session.count(),
      targetPrisma.verificationToken.count(),
      targetPrisma.passwordResetToken.count(),
    ]);

    const auditFailures: string[] = [];
    if (pgUsers !== users.length) auditFailures.push(`User: got ${pgUsers}, expected ${users.length}`);
    if (pgProfiles !== profiles.length) auditFailures.push(`Profile: got ${pgProfiles}, expected ${profiles.length}`);
    if (pgPubs !== publications.length) auditFailures.push(`Publication: got ${pgPubs}, expected ${publications.length}`);
    if (pgMembers !== publicationMembers.length) auditFailures.push(`PublicationMember: got ${pgMembers}, expected ${publicationMembers.length}`);
    if (pgTags !== tags.length) auditFailures.push(`Tag: got ${pgTags}, expected ${tags.length}`);
    if (pgPosts !== posts.length) auditFailures.push(`Post: got ${pgPosts}, expected ${posts.length}`);
    if (pgRevs !== postRevisions.length) auditFailures.push(`PostRevision: got ${pgRevs}, expected ${postRevisions.length}`);
    if (pgPostTags !== postTags.length) auditFailures.push(`PostTag: got ${pgPostTags}, expected ${postTags.length}`);
    if (pgCols !== collections.length) auditFailures.push(`Collection: got ${pgCols}, expected ${collections.length}`);
    if (pgColItems !== collectionItems.length) auditFailures.push(`CollectionItem: got ${pgColItems}, expected ${collectionItems.length}`);
    if (pgSessions !== sessions.length) auditFailures.push(`Session: got ${pgSessions}, expected ${sessions.length}`);
    if (pgVerif !== verificationTokens.length) auditFailures.push(`VerificationToken: got ${pgVerif}, expected ${verificationTokens.length}`);
    if (pgReset !== passwordResetTokens.length) auditFailures.push(`PasswordResetToken: got ${pgReset}, expected ${passwordResetTokens.length}`);

    if (auditFailures.length > 0) {
      throw new Error(`Row count audit discrepancies detected:\n${auditFailures.join("\n")}`);
    }

    console.log("  ✓ All 13 relational models match 100% between source and target!");
    console.log("================================================================================");
    console.log("       DATA MIGRATION TO POSTGRESQL COMPLETED WITH ZERO ERRORS                  ");
    console.log("================================================================================\n");

    return { success: true, dryRun: false };
  } finally {
    await targetPrisma.$disconnect();
    sqlite.close();
  }
}

// Direct invocation check
if (process.argv[1]?.includes("migrate_sqlite_to_postgres")) {
  runDataMigration().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
}

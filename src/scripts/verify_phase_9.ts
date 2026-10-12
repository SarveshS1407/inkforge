/**
 * INKFORGE — PHASE 9 COMPREHENSIVE VERIFICATION SUITE
 * Production Readiness, Security Hardening, CI/CD, Database Migration Readiness & Private Preview
 *
 * Scenarios Tested:
 * 1.  Production HTTP Security Headers in next.config.ts (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
 * 2.  Content Sanitizer Hostile Input Immunity (script tags, inline event handlers, iframe, SVG, math payloads)
 * 3.  Content Sanitizer Protocol Smuggling Defense (entity-encoded schemes, unquoted attributes, protocol-relative)
 * 4.  Content Sanitizer Legitimate Editorial Preservation (headings, paragraphs, blockquotes, secure hyperlinks)
 * 5.  Production Environment Schema Validation (src/lib/env.ts schema validation)
 * 6.  PostgreSQL Schema Definition Verification (prisma/schema.postgresql.prisma)
 * 7.  PostgreSQL Baseline Migration SQL Verification (prisma/migrations/0_init_postgresql/migration.sql)
 * 8.  SQLite-to-PostgreSQL Migration Script Verification (src/scripts/migrate_sqlite_to_postgres.ts)
 * 9.  Search Engine Indexing & Robots Directives (src/app/robots.ts public allow vs private disallow)
 * 10. Dynamic Sitemap Generator Verification (src/app/sitemap.ts)
 * 11. Public Folio OpenGraph & Private Draft Robots Directives (src/app/(reader)/read/[slug]/layout.tsx)
 * 12. Health Check API Endpoint Verification (src/app/api/v1/health/route.ts)
 * 13. GitHub Actions CI Workflow Verification (.github/workflows/ci.yml)
 * 14. PostgreSQL Backup & Disaster Recovery Runbook Verification (docs/POSTGRES_BACKUP_AND_DISASTER_RECOVERY.md)
 * 15. End-to-End System Integrity: Authenticated Document Lifecycle, OCC Versioning, Publishing & Teardown
 */

import fs from "fs";
import path from "path";
import nextConfig from "../../next.config";
import { sanitizeHtml, sanitizeUrl } from "../lib/sanitizer";
import { checkDatabaseConnection, prisma } from "../lib/db";
import { AuthService } from "../lib/services/auth.service";
import { DocumentService } from "../lib/services/document.service";

async function runPhase9Verification() {
  console.log("================================================================================");
  console.log("         INKFORGE PHASE 9: PRODUCTION READINESS & RELEASE PREPARATION           ");
  console.log("    Security Hardening, HTTP Headers, CI/CD, Postgres Readiness & Operations    ");
  console.log("================================================================================\n");

  (process.env as any).NODE_ENV = "test";
  const runId = Date.now().toString().slice(-6);

  // --------------------------------------------------------------------------
  // 1. Production HTTP Security Headers in next.config.ts
  // --------------------------------------------------------------------------
  console.log("[Test 1] Verifying Production HTTP Security Headers in next.config.ts...");
  if (typeof nextConfig.headers !== "function") {
    throw new Error("nextConfig.headers must be defined as an async function");
  }

  const headersConfig = await nextConfig.headers();
  const rootRouteHeaders = headersConfig.find((h) => h.source === "/:path*");
  if (!rootRouteHeaders) {
    throw new Error("Security headers for '/:path*' are missing");
  }

  const headerMap = new Map(rootRouteHeaders.headers.map((h) => [h.key, h.value]));

  const requiredHeaders = [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ];

  for (const name of requiredHeaders) {
    if (!headerMap.has(name)) {
      throw new Error(`Missing required HTTP security header: ${name}`);
    }
  }

  if (headerMap.get("X-Frame-Options") !== "DENY") {
    throw new Error("X-Frame-Options must be DENY for clickjacking defense");
  }
  if (headerMap.get("X-Content-Type-Options") !== "nosniff") {
    throw new Error("X-Content-Type-Options must be nosniff");
  }
  if (!headerMap.get("Content-Security-Policy")?.includes("default-src 'self'")) {
    throw new Error("CSP must define default-src 'self'");
  }
  console.log("  ✓ All required HTTP security headers verified (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.)\n");

  // --------------------------------------------------------------------------
  // 2. Content Sanitizer Hostile Input Immunity
  // --------------------------------------------------------------------------
  console.log("[Test 2] Verifying Content Sanitizer Hostile Input Immunity...");
  const maliciousInputs = [
    "<script>alert('xss')</script>",
    "<script src='https://evil.com/payload.js'></script>",
    "<img src='invalid' onerror='alert(1)'>",
    "<img src=x onerror=alert(1)>",
    "<details open ontoggle='fetch(\"http://evil.com\")'>Prose</details>",
    "<svg onload='alert(1)'><circle r=10/></svg>",
    "<math><mtext><style><!--</style><img src=x onerror=alert(1)></mtext></math>",
    "<iframe src='javascript:alert(1)'></iframe>",
    "<object data='javascript:alert(1)'></object>",
    "<embed src='javascript:alert(1)'>",
    "<form action='https://evil.com'><input type='password'></form>",
    "<button onclick='alert(1)'>Click</button>",
    "<scr<script>ipt>alert(1)</script>",
  ];

  for (const input of maliciousInputs) {
    const sanitized = sanitizeHtml(input);
    if (
      sanitized.toLowerCase().includes("<script") ||
      sanitized.toLowerCase().includes("onerror=") ||
      sanitized.toLowerCase().includes("onload=") ||
      sanitized.toLowerCase().includes("ontoggle=") ||
      sanitized.toLowerCase().includes("onclick=") ||
      sanitized.toLowerCase().includes("<svg") ||
      sanitized.toLowerCase().includes("<math") ||
      sanitized.toLowerCase().includes("<iframe") ||
      sanitized.toLowerCase().includes("<object") ||
      sanitized.toLowerCase().includes("<embed") ||
      sanitized.toLowerCase().includes("<form")
    ) {
      throw new Error(`Sanitizer failed to neutralize hostile payload: ${input} -> Output: ${sanitized}`);
    }
  }
  console.log("  ✓ Hostile executable HTML tags, event handlers, SVGs, and iframes completely neutralized\n");

  // --------------------------------------------------------------------------
  // 3. Content Sanitizer Protocol Smuggling Defense
  // --------------------------------------------------------------------------
  console.log("[Test 3] Verifying URL Protocol Smuggling & Entity Evasion Defense...");
  const hostileUrls = [
    "javascript:alert(1)",
    "javascript:void(0)",
    "jav&#x61;script:alert(1)",
    "java&#10;script:alert(1)",
    "java&Tab;script:alert(1)",
    "java&NewLine;script:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "blob:https://example.com/uuid",
    "file:///etc/passwd",
    "about:blank",
    "//evil.com/phishing",
    "\\evil.com/phishing",
  ];

  for (const url of hostileUrls) {
    const sanitized = sanitizeUrl(url);
    if (sanitized !== "#") {
      throw new Error(`sanitizeUrl failed to block dangerous URL: ${url} -> Output: ${sanitized}`);
    }
  }

  // Also verify sanitizeHtml strips unquoted or entity-encoded href attacks
  const htmlWithBadLink = '<a href="jav&#x61;script:alert(1)">Exploit Link</a>';
  const cleanedHtml = sanitizeHtml(htmlWithBadLink);
  if (cleanedHtml.includes("jav") && cleanedHtml.includes("script:")) {
    throw new Error(`sanitizeHtml allowed obfuscated link scheme: ${cleanedHtml}`);
  }
  console.log("  ✓ URL protocol smuggling, entity evasions, protocol-relative URLs, and backslashes blocked\n");

  // --------------------------------------------------------------------------
  // 4. Content Sanitizer Legitimate Editorial Formatting Preservation
  // --------------------------------------------------------------------------
  console.log("[Test 4] Verifying Legitimate Editorial Prose Preservation...");
  const legitimateArticle = `
    <h1>Chapter I: On Architectural Permanence</h1>
    <p>The <strong>inscribed</strong> word <em>endures</em> beneath the evening sky.</p>
    <blockquote>A sovereign workspace for deliberate literature.</blockquote>
    <ul>
      <li>First principle: Dignity</li>
      <li>Second principle: Craft</li>
    </ul>
    <p>Read the folio at <a href="https://inkforge.press/read/chapter-1">Inkforge Press</a>.</p>
  `;

  const cleanArticle = sanitizeHtml(legitimateArticle);
  if (
    !cleanArticle.includes("<h1>Chapter I: On Architectural Permanence</h1>") ||
    !cleanArticle.includes("<strong>inscribed</strong>") ||
    !cleanArticle.includes("<em>endures</em>") ||
    !cleanArticle.includes("<blockquote>A sovereign workspace for deliberate literature.</blockquote>") ||
    !cleanArticle.includes("rel=\"noopener noreferrer\"") ||
    !cleanArticle.includes("target=\"_blank\"")
  ) {
    throw new Error("Sanitizer corrupted legitimate manuscript markup!");
  }
  console.log("  ✓ Legitimate editorial markup, typography, blockquotes, and external links preserved with noopener\n");

  // --------------------------------------------------------------------------
  // 5. Production Environment Schema Validation (src/lib/env.ts)
  // --------------------------------------------------------------------------
  console.log("[Test 5] Verifying Environment Variable Validation in src/lib/env.ts...");
  const envContent = fs.readFileSync(path.join(process.cwd(), "src/lib/env.ts"), "utf8");
  if (!envContent.includes("DATABASE_URL") || !envContent.includes("NEXT_PUBLIC_APP_URL")) {
    throw new Error("src/lib/env.ts must validate mandatory environment variables");
  }
  if (!envContent.includes("GEMINI_API_KEY") || !envContent.includes("OPENAI_API_KEY")) {
    throw new Error("src/lib/env.ts must declare AI provider keys");
  }
  console.log("  ✓ Environment variable validation schema verified\n");

  // --------------------------------------------------------------------------
  // 6. PostgreSQL Schema Definition Verification
  // --------------------------------------------------------------------------
  console.log("[Test 6] Verifying PostgreSQL Prisma Schema Definition...");
  const pgSchemaPath = path.join(process.cwd(), "prisma/schema.postgresql.prisma");
  if (!fs.existsSync(pgSchemaPath)) {
    throw new Error("prisma/schema.postgresql.prisma does not exist");
  }
  const pgSchema = fs.readFileSync(pgSchemaPath, "utf8");
  if (!pgSchema.includes('provider = "postgresql"')) {
    throw new Error("prisma/schema.postgresql.prisma must specify provider = 'postgresql'");
  }
  if (!pgSchema.includes("model User") || !pgSchema.includes("model Post") || !pgSchema.includes("model PostRevision")) {
    throw new Error("prisma/schema.postgresql.prisma must declare core models User, Post, PostRevision");
  }
  console.log("  ✓ Production PostgreSQL Prisma schema confirmed\n");

  // --------------------------------------------------------------------------
  // 7. PostgreSQL Baseline Migration SQL Verification
  // --------------------------------------------------------------------------
  console.log("[Test 7] Verifying Baseline PostgreSQL Migration SQL...");
  const migrationSqlPath = path.join(process.cwd(), "prisma/migrations/0_init_postgresql/migration.sql");
  if (!fs.existsSync(migrationSqlPath)) {
    throw new Error("prisma/migrations/0_init_postgresql/migration.sql does not exist");
  }
  const migrationSql = fs.readFileSync(migrationSqlPath, "utf8");
  if (!migrationSql.includes('CREATE TABLE IF NOT EXISTS "User"') || !migrationSql.includes('CREATE TABLE IF NOT EXISTS "Post"')) {
    throw new Error("Migration SQL must create User and Post tables");
  }
  if (!migrationSql.includes('CREATE TABLE IF NOT EXISTS "PostRevision"')) {
    throw new Error("Migration SQL must create PostRevision table");
  }
  console.log("  ✓ Baseline PostgreSQL migration SQL (0_init_postgresql) verified\n");

  // --------------------------------------------------------------------------
  // 8. SQLite-to-PostgreSQL Migration Script Verification
  // --------------------------------------------------------------------------
  console.log("[Test 8] Verifying SQLite-to-PostgreSQL Migration Script...");
  const migrationScriptPath = path.join(process.cwd(), "src/scripts/migrate_sqlite_to_postgres.ts");
  if (!fs.existsSync(migrationScriptPath)) {
    throw new Error("src/scripts/migrate_sqlite_to_postgres.ts does not exist");
  }
  const migrationScript = fs.readFileSync(migrationScriptPath, "utf8");
  if (!migrationScript.includes("TARGET_DATABASE_URL") || !migrationScript.includes("upsert")) {
    throw new Error("Migration script must require TARGET_DATABASE_URL and use idempotent upserts");
  }
  console.log("  ✓ SQLite-to-PostgreSQL migration engine verified\n");

  // --------------------------------------------------------------------------
  // 9. Search Engine Robots Directives Verification (src/app/robots.ts)
  // --------------------------------------------------------------------------
  console.log("[Test 9] Verifying Robots.txt Configuration (robots.ts)...");
  const robotsPath = path.join(process.cwd(), "src/app/robots.ts");
  if (!fs.existsSync(robotsPath)) {
    throw new Error("src/app/robots.ts does not exist");
  }
  const robotsCode = fs.readFileSync(robotsPath, "utf8");
  if (!robotsCode.includes('disallow: ["/write", "/profile", "/api/", "/auth/"]')) {
    throw new Error("robots.ts must disallow private routes (/write, /profile, /api/, /auth/)");
  }
  if (!robotsCode.includes('allow: ["/", "/discover", "/read/", "/authors/", "/about", "/help"]')) {
    throw new Error("robots.ts must allow public editorial routes");
  }
  console.log("  ✓ Robots directives properly shield private drafts while exposing public folios\n");

  // --------------------------------------------------------------------------
  // 10. Dynamic Sitemap Generator Verification (src/app/sitemap.ts)
  // --------------------------------------------------------------------------
  console.log("[Test 10] Verifying Dynamic Sitemap Generator (sitemap.ts)...");
  const sitemapPath = path.join(process.cwd(), "src/app/sitemap.ts");
  if (!fs.existsSync(sitemapPath)) {
    throw new Error("src/app/sitemap.ts does not exist");
  }
  const sitemapCode = fs.readFileSync(sitemapPath, "utf8");
  if (!sitemapCode.includes('status: "PUBLISHED"') || !sitemapCode.includes("/read/")) {
    throw new Error("sitemap.ts must index published monographs");
  }
  console.log("  ✓ Dynamic sitemap generator verified\n");

  // --------------------------------------------------------------------------
  // 11. Public Folio OpenGraph & Private Draft Robots Directives
  // --------------------------------------------------------------------------
  console.log("[Test 11] Verifying Public Reader OpenGraph & Metadata (read/[slug]/layout.tsx)...");
  const readerLayoutPath = path.join(process.cwd(), "src/app/(reader)/read/[slug]/layout.tsx");
  if (!fs.existsSync(readerLayoutPath)) {
    throw new Error("src/app/(reader)/read/[slug]/layout.tsx does not exist");
  }
  const readerLayoutCode = fs.readFileSync(readerLayoutPath, "utf8");
  if (!readerLayoutCode.includes("openGraph:") || !readerLayoutCode.includes("canonical:")) {
    throw new Error("Reader layout must generate OpenGraph and canonical URL metadata");
  }
  if (!readerLayoutCode.includes("robots: { index: false, follow: false }")) {
    throw new Error("Reader layout must block search indexation on unpublished drafts");
  }
  console.log("  ✓ Public reader layout delivers OpenGraph metadata and shields drafts from search engines\n");

  // --------------------------------------------------------------------------
  // 12. Health Check API Endpoint Verification (src/app/api/v1/health/route.ts)
  // --------------------------------------------------------------------------
  console.log("[Test 12] Verifying Health Check Endpoint Implementation...");
  const healthPath = path.join(process.cwd(), "src/app/api/v1/health/route.ts");
  if (!fs.existsSync(healthPath)) {
    throw new Error("src/app/api/v1/health/route.ts does not exist");
  }
  const healthCode = fs.readFileSync(healthPath, "utf8");
  if (!healthCode.includes("checkDatabaseConnection") || !healthCode.includes("503")) {
    throw new Error("Health check must probe database connectivity and return 503 on degradation");
  }
  console.log("  ✓ Operational health check endpoint confirmed\n");

  // --------------------------------------------------------------------------
  // 13. GitHub Actions CI Workflow Verification
  // --------------------------------------------------------------------------
  console.log("[Test 13] Verifying GitHub Actions CI Workflow (.github/workflows/ci.yml)...");
  const ciPath = path.join(process.cwd(), ".github/workflows/ci.yml");
  if (!fs.existsSync(ciPath)) {
    throw new Error(".github/workflows/ci.yml does not exist");
  }
  const ciCode = fs.readFileSync(ciPath, "utf8");
  if (!ciCode.includes("npm ci") || !ciCode.includes("npm test") || !ciCode.includes("npm run build")) {
    throw new Error("CI workflow must run dependencies install, tests, and production build");
  }
  console.log("  ✓ GitHub Actions CI workflow verified\n");

  // --------------------------------------------------------------------------
  // 14. PostgreSQL Backup & Disaster Recovery Runbook Verification
  // --------------------------------------------------------------------------
  console.log("[Test 14] Verifying PostgreSQL Backup & Disaster Recovery Runbook...");
  const runbookPath = path.join(process.cwd(), "docs/POSTGRES_BACKUP_AND_DISASTER_RECOVERY.md");
  if (!fs.existsSync(runbookPath)) {
    throw new Error("docs/POSTGRES_BACKUP_AND_DISASTER_RECOVERY.md does not exist");
  }
  const runbookCode = fs.readFileSync(runbookPath, "utf8");
  if (!runbookCode.includes("pg_dump") || !runbookCode.includes("pg_restore") || !runbookCode.includes("RPO")) {
    throw new Error("Runbook must document pg_dump, pg_restore, and recovery objectives");
  }
  console.log("  ✓ Disaster recovery runbook verified\n");

  // --------------------------------------------------------------------------
  // 15. End-to-End System Integrity & Document Lifecycle
  // --------------------------------------------------------------------------
  console.log("[Test 15] Running End-to-End System Integrity & Document Lifecycle Test...");
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.status !== "connected") {
    throw new Error(`Database connectivity check failed: ${dbHealth.error}`);
  }

  const testEmail = `phase9.author.${runId}@inkforge.test`;
  const regAuthor = await AuthService.register({
    email: testEmail,
    username: `p9_author_${runId}`,
    displayName: "Production Auditor",
    password: "PasswordProduction123!",
  });
  const authorId = regAuthor.user.id;

  // Create document
  const draftDoc = await DocumentService.createDocument(
    {
      title: `Production Deployment Treatise ${runId}`,
      contentHtml: "<p>Composed with architectural gravity and verified security.</p>",
    },
    authorId
  );
  if (!draftDoc.id) throw new Error("Document creation failed");

  // Update document (OCC version increment)
  const updatedDoc = await DocumentService.updateDocument(
    draftDoc.id,
    {
      contentHtml: "<p>Composed with architectural gravity and verified security. Revision confirmed.</p>",
      expectedVersion: draftDoc.version,
    },
    authorId
  );
  if (updatedDoc.version !== draftDoc.version + 1) {
    throw new Error(`Expected incremented version, got ${updatedDoc.version}`);
  }

  // Publish document
  const publishedDoc = await DocumentService.publishDocument(draftDoc.id, authorId);
  if (publishedDoc.status !== "PUBLISHED") {
    throw new Error("Document publication failed");
  }

  // Retrieve published document by slug
  const publicFolio = await DocumentService.getDocumentBySlug(publishedDoc.slug!);
  if (!publicFolio || publicFolio.id !== draftDoc.id) {
    throw new Error("Failed to retrieve public folio by slug");
  }

  // Teardown test records cleanly
  await prisma.postRevision.deleteMany({ where: { postId: draftDoc.id } });
  await prisma.post.delete({ where: { id: draftDoc.id } });
  await prisma.verificationToken.deleteMany({ where: { userId: authorId } });
  await prisma.profile.deleteMany({ where: { userId: authorId } });
  await prisma.session.deleteMany({ where: { userId: authorId } });
  await prisma.user.delete({ where: { id: authorId } });

  console.log("  ✓ End-to-end document lifecycle, OCC versioning, publishing, and teardown succeeded\n");

  console.log("================================================================================");
  console.log("    ✓ ALL 15 PHASE 9 VERIFICATION SCENARIOS COMPLETED SUCCESSFULLY!             ");
  console.log("================================================================================");
}

runPhase9Verification().catch((err) => {
  console.error("\n❌ PHASE 9 VERIFICATION FAILED:", err);
  process.exit(1);
});

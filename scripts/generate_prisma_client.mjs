#!/usr/bin/env node
/**
 * INKFORGE — DYNAMIC PRISMA CLIENT GENERATOR
 * Detects whether the active database is PostgreSQL (e.g. Supabase, Neon, Vercel)
 * or SQLite (local development) and generates the corresponding Prisma Client.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function loadEnvIfPresent() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    const val = rest.join("=").replace(/^["']|["']$/g, "").trim();
    if (!process.env[key.trim()]) {
      process.env[key.trim()] = val;
    }
  }
}

loadEnvIfPresent();

const dbUrl = process.env.DATABASE_URL || "";
const isPostgres =
  dbUrl.startsWith("postgres://") ||
  dbUrl.startsWith("postgresql://") ||
  process.env.PRISMA_SCHEMA === "postgresql";

const schemaPath = isPostgres
  ? "prisma/schema.postgresql.prisma"
  : "prisma/schema.prisma";

console.log(
  `[INKFORGE] Generating Prisma Client for ${
    isPostgres ? "PostgreSQL" : "SQLite"
  } using ${schemaPath}...`
);

// If using PostgreSQL and DIRECT_URL is unset, default DIRECT_URL to DATABASE_URL
if (isPostgres && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = dbUrl;
}

try {
  execSync(`npx prisma generate --schema=${schemaPath}`, {
    stdio: "inherit",
    env: { ...process.env },
  });
  console.log(`[INKFORGE] ✓ Prisma Client generation successful.`);
} catch (err) {
  console.error(`[INKFORGE] ✗ Failed to generate Prisma Client:`, err.message);
  process.exit(1);
}

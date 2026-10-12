#!/usr/bin/env node
/**
 * INKFORGE — PRISMA COMMAND RUNNER
 * Routes Prisma CLI commands (db push, validate, studio) to the correct schema
 * based on whether PostgreSQL or SQLite is active.
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

const command = process.argv[2] || "validate";
const extraArgs = process.argv.slice(3).join(" ");

const dbUrl = process.env.DATABASE_URL || "";
const isPostgres =
  dbUrl.startsWith("postgres://") ||
  dbUrl.startsWith("postgresql://") ||
  process.env.PRISMA_SCHEMA === "postgresql";

const schemaPath = isPostgres
  ? "prisma/schema.postgresql.prisma"
  : "prisma/schema.prisma";

if (isPostgres && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = dbUrl;
}

const fullCmd = `npx prisma ${command} --schema=${schemaPath} ${extraArgs}`.trim();
console.log(`[INKFORGE] Executing: ${fullCmd}`);

try {
  execSync(fullCmd, {
    stdio: "inherit",
    env: { ...process.env },
  });
} catch (err) {
  process.exit(err.status || 1);
}

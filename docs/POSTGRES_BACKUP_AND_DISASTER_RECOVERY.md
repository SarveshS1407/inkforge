# INKFORGE — POSTGRESQL BACKUP & DISASTER RECOVERY SPECIFICATION

**Platform Target:** Managed PostgreSQL (Neon / Supabase / Railway)  
**Document Classification:** Operations & Reliability Standard  

---

## 1. Provider Capabilities & Architectural Overview

When INKFORGE transitions from local development to managed PostgreSQL in production, the data architecture relies on a relational, multi-tenant database.

### Neon Serverless PostgreSQL (Recommended Default)
* **Continuous Point-in-Time Recovery (PITR):** Neon continuously archives Write-Ahead Logs (WAL) to Amazon S3, allowing restoration to any arbitrary second within the retention window (7 days on standard plans, 30 days on enterprise).
* **Instant Database Branching:** Neon allows creating instant, copy-on-write database branches in seconds without copying raw data. This allows testing a migration or data restore on an isolated branch before applying it to the production branch.
* **Storage Redundancy:** Automatic multi-AZ storage replication.

### Supabase / Railway Postgres
* **Daily Automated Snapshots:** Scheduled nightly physical backups with 7–30 day retention.
* **Manual Logical Dumps:** Available via standard `pg_dump`.

---

## 2. Recovery Objectives & Targets

* **RPO (Recovery Point Objective):** < 5 minutes (via continuous WAL archiving).
* **RTO (Recovery Time Objective):** < 15 minutes to switch connections to a restored branch.

---

## 3. Standard Backup Procedures

### A. Automated Provider Snapshots
Configured automatically in the provider dashboard (Neon / Supabase). Verify that WAL archiving is enabled.

### B. Manual Logical Backup Before Major Releases (`pg_dump`)
Before executing schema migrations or significant editorial reorganizations:

```bash
# 1. Export timestamped, compressed PostgreSQL logical backup
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="inkforge_backup_$(date +%Y%m%d_%H%M%S).dump"

# 2. Compute and store SHA-256 checksum
shasum -a 256 "inkforge_backup_"*.dump > "inkforge_backup_$(date +%Y%m%d_%H%M%S).sha256"
```

---

## 4. Disaster Recovery & Restoration Runbook

### Scenario A: Instant Rollback via Neon Branching (Fastest — < 3 Minutes)
If a bad migration or accidental deletion occurs on Neon:
1. In the Neon Console, navigate to **Branches**.
2. Click **Create Branch from Point in Time**.
3. Select the timestamp immediately prior to the incident (e.g. 5 minutes ago).
4. Update `DATABASE_URL` in Vercel to point to the newly restored branch.
5. Trigger redeployment: traffic is instantly restored.

### Scenario B: Logical Restore to Clean Database (`pg_restore`)
If restoring into a new or clean PostgreSQL instance:
```bash
# 1. Verify clean database target
psql "$NEW_DATABASE_URL" -c "SELECT current_database();"

# 2. Restore schema and data
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="$NEW_DATABASE_URL" \
  "inkforge_backup_TIMESTAMP.dump"
```

---

## 5. Post-Restore Data Validation Checklist

Immediately after restoring a database, execute validation:

1. **Row Count Audit:**
   ```sql
   SELECT
     (SELECT COUNT(*) FROM "User") AS user_count,
     (SELECT COUNT(*) FROM "Profile") AS profile_count,
     (SELECT COUNT(*) FROM "Post") AS post_count,
     (SELECT COUNT(*) FROM "PostRevision") AS revision_count,
     (SELECT COUNT(*) FROM "Collection") AS collection_count;
   ```
2. **Foreign Key Integrity Check:**
   Confirm zero orphaned records:
   ```sql
   SELECT COUNT(*) FROM "Post" WHERE "authorId" NOT IN (SELECT "id" FROM "User");
   SELECT COUNT(*) FROM "PostRevision" WHERE "postId" NOT IN (SELECT "id" FROM "Post");
   ```
3. **Application Smoke Test:**
   * Invoke `GET /api/v1/health` to confirm active database connection.
   * Log in with an established author account.
   * View a published monograph on `/read/[slug]`.
   * Verify autosave in `/write`.

---

## 6. Outstanding Manual Pre-Launch Verification

> [!IMPORTANT]
> A live restore test against an external managed PostgreSQL database remains outstanding until a production PostgreSQL database instance is provisioned by the project owner. Never use a live production database as a restore test target.

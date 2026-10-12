# INKFORGE — Setup & Deployment Guide

This guide details local environment setup, dual-database configuration (SQLite prototyping vs. Supabase PostgreSQL production), CI/CD verification, and deployment to Vercel.

---

## 1. System Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+)
- **Git**: Modern Git client
- **Database**:
  - Local development: Zero-dependency embedded SQLite (`prisma/dev.db`)
  - Production / Staging: Managed PostgreSQL (Supabase, Neon, or AWS RDS)

---

## 2. Environment Variables Configuration

Copy `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

### Environment Variable Specification

| Variable | Required? | Context | Purpose & Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | All | Database connection string. For SQLite: `file:./prisma/dev.db`. For Supabase runtime pooling: `postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Prod Only | Supabase / Migrations | Direct session database string for Prisma DDL migrations: `postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:5432/postgres` |
| `NODE_ENV` | Optional | App Runtime | `"development"` locally, `"production"` on Vercel, `"test"` in CI |
| `NEXT_PUBLIC_APP_URL` | **Yes** | App Runtime | Canonical origin for email links and metadata (e.g., `http://localhost:3000` or `https://inkforge-sigma.vercel.app`) |
| `RESEND_API_KEY` | Optional in Dev | Auth / Emails | API key from Resend (`re_...`) for verification & reset emails. If unset in dev, links print directly to terminal. |
| `EMAIL_FROM` | Optional in Dev | Auth / Emails | Verified sender identity (e.g., `INKFORGE <editors@inkforge.press>`) |
| `GEMINI_API_KEY` | Optional | AI Writing Copilot | Google AI Studio API key for Gemini 2.5 Flash editorial copilot |
| `OPENAI_API_KEY` | Optional | AI / Covers | OpenAI key for GPT-4o-mini copilot or DALL-E cover art |
| `INKFORGE_AI_PROVIDER`| Optional | AI Copilot | Default provider: `"gemini"`, `"openai"`, or `"mock"` (zero-cost editorial engine) |

---

## 3. Dual-Schema Database Architecture

INKFORGE utilizes a dynamic multi-schema strategy:

1. **`prisma/schema.prisma`**: Configured with `provider = "sqlite"`. Used for lightweight, zero-configuration local prototyping and GitHub Actions test execution.
2. **`prisma/schema.postgresql.prisma`**: Configured with `provider = "postgresql"` and `directUrl = env("DIRECT_URL")`. Used for staging and production deployments.

### Automatic Schema Resolution
The build script [`scripts/generate_prisma_client.mjs`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/scripts/generate_prisma_client.mjs) inspects `DATABASE_URL`:
- If `DATABASE_URL` starts with `postgresql://` or `postgres://`, it automatically targets `prisma/schema.postgresql.prisma`.
- Otherwise, it falls back to `prisma/schema.prisma` (SQLite).

### Common Database Commands

```bash
# Generate Prisma Client based on active DATABASE_URL
npm run db:generate

# Push schema changes directly to local SQLite
npm run db:push

# Push schema changes directly to PostgreSQL (prototyping/staging)
npm run db:push:postgres

# Deploy baseline Prisma migrations in production (Vercel / Supabase)
npm run db:migrate:postgres

# Migrate historical data from local SQLite to PostgreSQL
npm run db:migrate:data

# Launch Prisma Studio GUI
npm run db:studio
```

---

## 4. Local Development Workflow

### 1. Install Dependencies
```bash
npm install
```
*(Runs `postinstall` script to generate the appropriate Prisma Client).*

### 2. Initialize Local Database
```bash
npx prisma db push --skip-generate
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Quality Checks
```bash
# Type check without emitting files
npx tsc --noEmit

# Run ESLint rules
npm run lint

# Run all verification test suites
npm test
```

---

## 5. Production Deployment to Vercel

### 1. Connect Repository
Link the GitHub repository (`SarveshS1407/inkforge`) in the Vercel Dashboard. The default Next.js framework preset is automatically detected.

### 2. Configure Production Environment Variables
In **Project Settings -> Environment Variables**, configure the following for the `Production` environment:
- `DATABASE_URL`: Your Supabase transaction pooler URI (Port `6543`, `?pgbouncer=true`).
- `DIRECT_URL`: Your Supabase session pooler URI (Port `5432`).
- `NODE_ENV`: `production`
- `NEXT_PUBLIC_APP_URL`: `https://inkforge-sigma.vercel.app`
- `RESEND_API_KEY`: Your live Resend API key.
- `EMAIL_FROM`: Your verified domain email address.
- `GEMINI_API_KEY`: Your Google AI Studio API key.
- `INKFORGE_AI_PROVIDER`: `gemini`

### 3. Build & Deploy Configuration
- **Build Command**: `npm run build`
  *(Invokes `node scripts/generate_prisma_client.mjs && next build`, generating the PostgreSQL client before Next.js compiles).*
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4. Applying Production Migrations
Before promoting a release that alters database tables, run:
```bash
DATABASE_URL="<prod_pooler_url>" DIRECT_URL="<prod_direct_url>" npm run db:migrate:postgres
```
This safely executes migrations from `prisma/migrations/` using the session pooler.

### 5. Post-Deployment Verification Checklist
1. Query the healthcheck endpoint: `curl https://inkforge-sigma.vercel.app/api/v1/health`
   - Expect `200 OK` with `"database": { "status": "connected", "provider": "postgresql" }`.
2. Visit the homepage on mobile & desktop: verify the 3D book cover renders and opens smoothly.
3. Test author registration & login.
4. Create a draft in Scribe Studio, verify autosave indicator updates.
5. Publish a monograph and verify public access at `/read/:slug`.

---

## 6. Continuous Integration (CI/CD)

The GitHub Actions pipeline defined in [`.github/workflows/ci.yml`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/.github/workflows/ci.yml) executes automatically on every pull request and push to `main`:

```mermaid
flowchart LR
    A[Git Push / PR] --> B[Install Dependencies]
    B --> C[Prisma Generate]
    C --> D[SQLite Push]
    D --> E[Validate Postgres Schema]
    E --> F[TypeScript Check]
    F --> G[ESLint Check]
    G --> H[Automated Test Verification]
    H --> I[Next.js Production Build]
    I --> J[Ready for Vercel Deploy]
```

All jobs must pass cleanly before branches can be merged to `main`.

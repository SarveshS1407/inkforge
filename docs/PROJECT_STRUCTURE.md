# INKFORGE — Project Structure & Module Reference

This document maps the complete file organization, module responsibilities, and coding conventions across the INKFORGE repository.

---

## 1. High-Level Repository Architecture

```
inkforge/
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI workflow (lint, test, build)
├── docs/                              # Technical and user documentation suite
│   ├── README.md                      # Central documentation index
│   ├── USER_GUIDE.md                  # Comprehensive user and author manual
│   ├── PAGE_AND_NAVIGATION_MAP.md     # App Router page routes & navigation flow
│   ├── ARCHITECTURE.md                # System architecture, state & 3D physics
│   ├── DATABASE.md                    # Relational database schema & Prisma models
│   ├── API_AND_INTEGRATIONS.md        # REST API reference (27 endpoints) & integrations
│   ├── SETUP_AND_DEPLOYMENT.md        # Environment setup, dual-schema & Vercel deployment
│   ├── TESTING_AND_KNOWN_ISSUES.md    # Test suites, verification scripts & edge cases
│   └── PROJECT_STRUCTURE.md           # Repository layout & module reference (this file)
├── prisma/
│   ├── schema.prisma                  # SQLite prototyping schema
│   ├── schema.postgresql.prisma       # Production PostgreSQL schema with connection pooling
│   └── migrations/                    # SQL migration records
│       └── 0_init_postgresql/         # PostgreSQL baseline migration
├── public/                            # Static assets, fonts, icons, web manifest
│   ├── favicon.ico
│   ├── icon.svg
│   └── manifest.json                  # PWA application manifest
├── scripts/                           # Build & CLI orchestration scripts
│   ├── generate_prisma_client.mjs     # Dynamic client generator (SQLite vs Postgres)
│   └── run_prisma_command.mjs         # Cross-platform Prisma CLI wrapper
├── src/                               # Application source code
│   ├── app/                           # Next.js 15 App Router pages & API routes
│   ├── components/                    # Modular UI components & design system
│   ├── hooks/                         # Reusable React hooks
│   ├── lib/                           # Core utilities, services & database clients
│   ├── scripts/                       # Programmatic verification test suites
│   └── types/                         # TypeScript interfaces & domain declarations
├── .env.example                       # Environment variable template
├── next.config.ts                     # Next.js build config & HTTP security headers
├── package.json                       # Dependencies & project scripts
├── postcss.config.mjs                 # PostCSS Tailwind CSS v4 processor
├── tsconfig.json                      # Strict TypeScript compiler configuration
└── vercel.json                        # Vercel deployment configuration
```

---

## 2. Directory Breakdown & Module Responsibilities

### `src/app/` — Next.js 15 App Router
Contains all pages, layouts, route handlers, error boundaries, and metadata generators.

- `src/app/page.tsx`: Editorial homepage featuring the interactive 3D Physical Book, curated monographs, and gazetteer.
- `src/app/globals.css`: Tailwind CSS v4 directives, paper material themes (Cotton, Vellum, Buckram), typography rules, and GPU scroll motion keyframes.
- `src/app/layout.tsx`: Root application shell, font imports (Newsreader, EB Garamond, JetBrains Mono), theme provider, and global metadata.
- `src/app/(reader)/`: Reader experience route group.
  - `read/[slug]/page.tsx`: Clean, typography-first public reading folio with font-family and font-size controls.
- `src/app/(studio)/`: Author writing studio route group.
  - `write/page.tsx`: Full-screen Scribe Studio editor powered by Tiptap with autosave indicator and AI Copilot drawer.
  - `posts/page.tsx`: Author's personal manuscript archive and drafting dashboard.
- `src/app/books/`: Book-level reading and multi-chapter organization views.
- `src/app/authors/`:
  - `authors/page.tsx`: Directory of published authors with metrics and search.
  - `authors/[username]/page.tsx`: Individual author folio, biography, and published works.
- `src/app/collections/`:
  - `collections/page.tsx`: Anthology collections explorer and author curation interface.
- `src/app/discover/`:
  - `discover/page.tsx`: Literary gazetteer with tag filters, reading time estimations, and trending essays.
- `src/app/about/` & `src/app/help/`: Editorial manifesto, colophon, and author support guides.
- `src/app/api/`: Exactly 27 REST route handlers organized by domain (`v1/auth`, `v1/documents`, `v1/collections`, `v1/authors`, `v1/ai`, `covers`, `v1/health`).
- `src/app/robots.ts` & `src/app/sitemap.ts`: Dynamic SEO robots directives and XML sitemap generator.

### `src/components/` — UI Component System
Modular, highly reusable React components grouped by functional domain:

- `components/landing/`:
  - `PhysicalBook.tsx`: Core 3D interactive book with realistic page turns, lift-off elevation, specular lighting sheen, touch swipe gestures, and tactile haptic feedback.
  - `Hero.tsx`: Typography-driven landing banner and introductory callouts.
- `components/editor/`:
  - `ScribeEditor.tsx`: Tiptap editor integration with ProseMirror rich text commands.
  - `EditorToolbar.tsx`: Formatting bar (headings, blockquotes, italics, links, word count).
  - `FontControls.tsx`: Reader/writer font switcher and point-size slider.
- `components/ai/`:
  - `AiCopilotDrawer.tsx`: Sidebar assistant for prose continuation, rewriting, and literary critique.
  - `RevisionComparison.tsx`: Side-by-side diff comparison between AI suggestions and existing text.
- `components/navigation/`:
  - `Navbar.tsx`: Responsive navigation header with active-link indicators and authentication state.
  - `MobileNav.tsx`: Mobile slide-out drawer optimized for touch ergonomics (>= 48px tap targets).
  - `Footer.tsx`: Editorial colophon, publishing credits, and theme selection toggle.
- `components/theme/`:
  - `ThemeContext.tsx`: Theme context provider supporting Paper Cotton, Warm Vellum, and Dark Buckram.

### `src/hooks/` — Custom React Hooks
- `useScrollReveal.ts`: High-performance `IntersectionObserver` hook triggering CSS GPU reveal classes with automatic reduced-motion bypass.
- `useAutosave.ts`: Debounced document saving hook with optimistic locking and pending state tracking.
- `useMediaQuery.ts`: Viewport breakpoint listener for responsive layout switching.
- `useTheme.ts`: Accessor hook for the active editorial color palette and font settings.

### `src/lib/` — Core Infrastructure & Business Logic
- `lib/db/`:
  - `index.ts`: Prisma Client singleton with connection retry logic, query performance telemetry, and health check utilities.
- `lib/api/`:
  - `response.ts`: Standardized JSON response envelope builders (`apiSuccess`, `apiError`) and exception handlers.
- `lib/auth/`:
  - `guard.ts`: Route protection middleware (`requireAuth`) validating active sessions.
  - `session.ts`: Session token creation, cookie serialization, and cryptographic hashing.
  - `password.ts`: Secure password hashing using modern cryptographic standards.
- `lib/services/`:
  - `auth.service.ts`: User registration, credential verification, and profile management.
  - `document.service.ts`: Document CRUD, optimistic locking, slug generation, and publishing transitions.
  - `collection.service.ts`: Anthology creation, curation, and ordering.
  - `ai.service.ts`: Multi-provider AI writing assistant (Gemini, OpenAI, Editorial Mock) with sliding-window rate limiting.
- `lib/sanitizer/`:
  - `index.ts`: Strict HTML and URL sanitizer defending against XSS, script injection, and protocol smuggling while preserving legitimate editorial styling.
- `lib/cover-generator/`:
  - `service.ts`: AI-assisted visual brief interpretation and cover artwork generation.

### `src/scripts/` — Automated Milestone Verifiers
Contains the programmatic test suites run by `npm test`:
- `verify_backend.ts`: Database connectivity and transaction verification.
- `verify_phase_2b.ts` through `verify_phase_9.ts`: Automated regression tests verifying authentication, studio autosave, revisions, collections, AI Copilot, mobile UX, security headers, and PostgreSQL migration compatibility.

---

## 3. Architecture & Coding Conventions

### Server vs. Client Components
- **Default to React Server Components (RSC)**: Keep pages (`page.tsx`) and layout shells as server components to minimize client JavaScript bundle size and maximize SEO performance.
- **Client Components (`'use client'`)**: Isolate client boundaries exclusively to interactive leaf components requiring browser APIs, React state, or DOM event listeners (e.g., `PhysicalBook.tsx`, `ScribeEditor.tsx`, `useScrollReveal.ts`).

### Styling & Design System
- Utilize Tailwind CSS v4 utility classes combined with custom semantic tokens:
  - `bg-paper-cotton`, `bg-paper-vellum`, `bg-paper-buckram` for editorial substrates.
  - `font-serif` (EB Garamond / Newsreader) for editorial headings and prose body.
  - `font-sans` for technical metadata and UI navigation controls.
  - `font-mono` (JetBrains Mono) for metrics, timestamps, and word counts.
- Use GPU-accelerated motion classes (`.scroll-pop-reveal`, `.scroll-emerge-left`, `.scroll-ink-reveal`) rather than heavy JavaScript animation libraries.

### Type Safety & Validation
- Define all shared data contracts in `src/types/`.
- Validate incoming API payloads using `zod` schemas before invoking service layer methods.
- Avoid the `any` type; maintain strict TypeScript checks (`"strict": true` in `tsconfig.json`).

# INKFORGE — System Architecture & Technical Specifications

This document details the architectural principles, client/server boundaries, state management systems, AST data pipeline, and database connection infrastructure powering INKFORGE.

---

## 1. High-Level Architectural Flow

```mermaid
graph TD
    Client["Client Browser / Mobile PWA"]
    Edge["Vercel Edge Network / CDN"]
    NextServer["Next.js 15 App Router Server"]
    PrismaClient["Prisma ORM 6.4 Client"]
    SupabasePooler["Supabase Transaction Pooler (Port 6543)"]
    SupabaseDirect["Supabase Session Pooler (Port 5432)"]
    PostgresDB[("PostgreSQL 15+ Database")]

    Client -->|"HTTPS / Fast Navigation"| Edge
    Edge -->|"Server Actions & API Routes"| NextServer
    NextServer -->|"Parameterized Queries"| PrismaClient
    PrismaClient -->|"Runtime App Traffic (DATABASE_URL)"| SupabasePooler
    PrismaClient -.->|"DDL & Migrations (DIRECT_URL)"| SupabaseDirect
    SupabasePooler -->|"pgBouncer Connection Pool"| PostgresDB
    SupabaseDirect -->|"Direct Engine Connection"| PostgresDB

    subgraph Client State Layers
        EditionCtx["EditionContext (Theme Tokens)"]
        StudioHook["useStudioDocument (Sync & Autosave)"]
        ScrollHook["useScrollReveal (GPU Motion Engine)"]
        DraftMgr["DraftManager (Local-First IndexedDB)"]
    end

    Client --- Client State Layers
```

---

## 2. Framework & Core Technologies

| Layer | Technology | Rationale & Configuration |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.2.1 | App Router architecture with nested layouts, route groups `(reader)` and `(studio)`, and optimized server/client component boundaries. |
| **UI Library** | React 19.0.0 | Concurrent React features, lightweight ref handling, and minimal bundle sizes. |
| **Styling** | Tailwind CSS v4 | Native CSS variable theme mappings, lightning-fast compilation, and no CSS runtime overhead. |
| **Editor** | Tiptap & ProseMirror | Block-based composition model, structured Abstract Syntax Tree (AST), and deterministic JSON persistence. |
| **Database** | PostgreSQL | Managed relational storage on Supabase with ACID transactions, relational integrity, and strict constraints. |
| **ORM** | Prisma 6.4.1 | Type-safe schema definition, multi-file schema management, automatic migrations, and transaction pooling. |
| **Hosting** | Vercel | Global edge caching, serverless API execution, automated preview deployments, and zero-config CI/CD. |

---

## 3. Client & Server Component Boundaries

INKFORGE strictly enforces clean separation between Server Components (RSC) and Client Components (`"use client"`):

### Server Components
- Serve static layouts, metadata heads, and initial public pages.
- Handle SEO tag generation, OpenGraph metadata, and structured JSON-LD schemas.
- Free of client-side JavaScript execution overhead.

### Client Components
- **Reading Surface (`/read/[slug]`):** Requires local scroll tracking, progress ribbon percentage computation, dynamic theme switching, and client-side bookmark modals.
- **Scribe Studio (`/write`):** Requires interactive Tiptap editor DOM instantiation, local keystroke debounce, IndexedDB autosave, and WebSocket/REST API communication.
- **3D Physical Book (`PhysicalBook.tsx`):** Requires 3D matrix transforms, interactive mouse parallax tilt (`rotateX`, `rotateY`), touch swipe event tracking, and haptic feedback.
- **Scroll Motion Engine (`useScrollReveal`):** Requires client-side `IntersectionObserver` observing DOM targets as they enter the viewport.

---

## 4. State Management Architecture

Instead of heavy external state managers (e.g. Redux), INKFORGE utilizes focused, modular React Contexts and custom hooks:

### 1. `EditionContext` (`src/components/theme/EditionContext.tsx`)
- Manages the three active tactile paper tones: `cotton` (default Ivory), `vellum` (Amber Newsprint), and `inkwell` (Midnight Buckram).
- Dynamically assigns CSS classes (`tone-cotton`, `tone-vellum`, `tone-inkwell`) to the root document element.
- Persists user preferences to `localStorage` and synchronizes with system `prefers-color-scheme`.

### 2. `useStudioDocument` (`src/hooks/useStudioDocument.ts`)
- Manages the entire lifecycle of an active manuscript:
  - **Debounced Local Save (300ms):** Keystrokes are immediately written to local storage.
  - **Cloud Synchronization (1500ms):** Changes are packaged and sent to `/api/v1/documents/[id]` with optimistic concurrency protection.
  - **Conflict Detection:** Monitors remote `version` changes; if another session increments the counter, prompts the user to resolve differences before overwriting.
  - **Revision Checkpointing:** Generates snapshot records in `DocumentRevision` on major milestones and publishing operations.

### 3. `useScrollReveal` (`src/hooks/useScrollReveal.ts`)
- Reusable IntersectionObserver hook observing elements with `.editorial-reveal`, `.scroll-pop-reveal`, `.scroll-emerge-left`, `.scroll-emerge-right`, `.scroll-ink-reveal`, and `.scroll-stagger-child`.
- Automatically toggles `.is-revealed` when elements intersect the viewport (threshold: 0.08, rootMargin: `-30px`).
- Gracefully checks `prefers-reduced-motion: reduce` and reveals all elements instantaneously if the user requests reduced motion.

---

## 5. Rich Text & Abstract Syntax Tree (AST) Serialization

INKFORGE rejects storing prose as unstructured, dangerous HTML blobs. Every document is maintained as a structured ProseMirror Abstract Syntax Tree:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Crafting Systems That Endure" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Software engineering suffers from a pervasive bias toward the ephemeral..." }
      ]
    },
    {
      "type": "blockquote",
      "content": [
        { "type": "text", "text": "Enduring software is built like a cathedral." }
      ]
    }
  ]
}
```

### Advantages of AST Serialization
- **Zero HTML Injection Vulnerabilities:** Content is parsed through strict node schemas before rendering.
- **Multi-Medium Output:** The same AST node tree is easily translated to clean HTML, Markdown, plain text, RSS syndication feeds, or ePub formats.
- **Granular Diffing:** Revision comparisons operate on structured AST nodes rather than fragile line-by-line regex.

---

## 6. Database Connection Pooling Architecture

To operate efficiently in serverless environments without exhausting PostgreSQL connection limits, INKFORGE implements dual-pooler Prisma architecture:

```
+-------------------------------------------------------------------------------+
|                       DATABASE_URL (Transaction Pooler)                       |
|   postgresql://postgres.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/  |
|                               ?pgbouncer=true                                 |
|                                                                               |
|   - Utilized by standard app queries, API routes, and Next.js server actions. |
|   - Reuses connections rapidly via pgBouncer transaction pooling.             |
+-------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------+
|                         DIRECT_URL (Session Pooler)                           |
|   postgresql://postgres.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:5432/  |
|                                                                               |
|   - Utilized exclusively during schema migrations (prisma migrate deploy).   |
|   - Supports advisory locks, DDL commands, and long-running table mutations.  |
+-------------------------------------------------------------------------------+
```

---

## 7. 3D Physical Book Motion & Lighting Physics

The interactive centerpiece in [`PhysicalBook.tsx`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/components/landing/PhysicalBook.tsx) implements authentic physical bookcraft:

1. **3D Perspective Stage (`perspective-book`):** Configured with `perspective: 1800px` to give the virtual volume natural vanishing points without extreme distortion.
2. **Hinged Cover Assembly:** The front board rotates along its spine hinge axis (`transformOrigin: "0% 50%"`) from `0deg` (closed) to `-180deg` (fully open).
3. **Lift-Off Elevation:** When opening, the stage elevates into Z-space (`translateZ: 28px translateY: -10px`) while the contact desk shadow softens and diffuses (`blur: 35px`).
4. **Specular Sheen Reflection:** A diagonal specular gradient (`.book-cover-sheen`) glides across the buckram cloth texture as the cover turns through the virtual light source.
5. **Gutter Valley Shadows & Paper Arching:** Gradient overlays simulate the deep valley shadows where pages meet sewn spine binding threads.

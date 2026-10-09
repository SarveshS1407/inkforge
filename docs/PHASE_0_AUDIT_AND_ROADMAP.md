# INKFORGE — Master UI/UX Transformation: Phase 0 Audit & Roadmap

## 1. Executive Summary

INKFORGE is a digital publishing and reading platform built around the core promise: **Write. Publish. Discover. Read.**
This transformation elevates the product into a **Living Editorial** experience—embodying the permanence, typography, and tactile craft of classical bookmaking married with the fluidity, speed, and responsiveness of modern software.

---

## 2. Baseline Audit Matrix

| Category | Component / Area | Existing State | Transformation Action |
| :--- | :--- | :--- | :--- |
| **Preserve** | **Physical 3D Book** | Tactile 3D book cover, page turn, paper edges, headband, cloth weave, and draped ribbon bookmark. | Preserve all physics and material properties; refine lighting, scale calculations, and touch usability. |
| **Preserve** | **Editorial Identity** | Oxblood (`#831e26`), Amber Gold (`#b68222`), Charter serif, and SF Mono folios. | Preserve and refine contrast ratios, baseline grids, and typographic scale across all tones. |
| **Preserve** | **Paper Tone Engine** | Three curated paper editions: Cotton Ivory, Bookshop Vellum, Midnight Buckram. | Preserve seamless toggle and persistent localStorage state; audit color tokens across all components. |
| **Preserve** | **Scribe Studio & Local Autosave** | Tiptap rich block composition with real-time word counting, print page estimation, and local draft persistence. | Preserve zero-friction writing and autosave; elevate typography, toolbar ergonomics, and galley proof mode. |
| **Preserve** | **Core Routing** | `/`, `/read/[slug]`, `/discover`, `/write`, `/posts`, `/collections`, `/authors`, `/help`, `/about`. | Maintain all existing routes, slugs, and parameter models with zero dead links. |
| **Refine** | **Landing Page Hierarchy** | Stacking of duplicate hero banners ("A Living Digital Book" followed by "Where Great Writing Becomes Literature"). | Unify into a single, confident editorial masthead where the 3D book and primary destinations lead seamlessly into curated monographs. |
| **Refine** | **Primary Navigation** | Scattered navigation elements, ambiguous secondary buttons, inconsistent mobile drawer. | Unify into a crisp hierarchy: Primary (Read, Discover, Write), Secondary (Collections, Authors), Utility (Help, About, Account). |
| **Refine** | **Reading Experience** | Variable line lengths and inconsistent marginalia behavior. | Enforce classical 65–75 character measure (`max-w-2xl` prose column), interactive footnotes, silky drop-caps, and solitary immersion mode. |
| **Simplify** | **Destination Cards** | Numbered "Destination 01 / 02 / 03" cards with redundant descriptive text. | Transform into elegant, high-clarity editorial entryways that pass the 5-second test immediately. |
| **Simplify** | **Creator Workflow** | Exclude AI book-generation and AI cover generator per explicit scope restriction. | Focus creator experience directly on Scribe Studio (`/write`) and the Editorial Ledger (`/posts`). |
| **Repair** | **Theme Variable Mismatch** | `layout.tsx` references `bg-[var(--paper-bg)]` instead of `--paper-canvas`. | Fix CSS variable token in `layout.tsx` and ensure seamless background rendering in all tones. |
| **Repair** | **Focus Rings & A11y** | Multiple elements have `focus:outline-none` without accessible focus rings. | Implement uniform `focus-visible:ring-2 focus-visible:ring-[var(--oxblood)]` across all interactive elements. |
| **Repair** | **Responsive Scaling** | Fore-edge book paper stack and mobile drawer layout shifting on small screens (<380px). | Harden responsive scale factor, prevent horizontal overflows, and ensure min 44px touch targets. |

---

## 3. Seven-Phase Implementation Roadmap

1. **Phase 1 — Navigation and Information Architecture**
   - Refactor `Header.tsx` with clean semantic tags, accessible focus rings, clear active states, and refined mobile drawer.
   - Clarify Primary (`Read`, `Discover`, `Write`), Secondary (`Collections`, `Authors`), and Utility (`Help`, `About`, `Sign In`).

2. **Phase 2 — Landing Page Refinement**
   - Unify `InkforgeLanding.tsx` and `page.tsx` into a singular, breathtaking editorial experience.
   - The 3D Book is the hero centerpiece; primary actions (`Read · Discover · Write`) are immediately unmistakable.
   - Clean transition into the curated anthology and dispatches below without redundant banners.

3. **Phase 3 — Core Experience Refinement**
   - **Read**: Perfect the reading layout, typography, marginalia, bookmarking, and solitary mode.
   - **Discover**: Streamline the catalog, topic filters, instant search, and empty states.
   - **Write & Posts**: Elevate Scribe Studio, draft management, word goal tracking, and galley proof inspection.

4. **Phase 4 — Visual Craftsmanship**
   - Harmonize typography scales, margins, micro-borders, and button padding.
   - Ensure exquisite contrast across Cotton, Vellum, and Buckram editions.
   - Repair CSS variables in `layout.tsx` and `globals.css`.

5. **Phase 5 — Responsive Design & Accessibility QA**
   - Verify on mobile (320px–480px), tablet (768px), and desktop (1024px+).
   - Test full keyboard navigation, screen reader ARIA landmarks, and reduced motion modes.

6. **Phase 6 — First-Time-User Evaluation**
   - Validate the 9 key user journeys without prior knowledge.
   - Verify the 5-second test: Write, Publish, Discover, Read.

7. **Phase 7 — Final Verification & Build Check**
   - Run type checks, linter, Next.js build, and console verification. Zero regressions.

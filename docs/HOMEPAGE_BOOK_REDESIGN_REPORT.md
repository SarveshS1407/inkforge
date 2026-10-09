# INKFORGE — Homepage Book & Cover Redesign
## Editorial Art Direction · Cover Composition · Typography · Interaction Polish

### Executive Summary

The central homepage book of **INKFORGE** has been transformed into a physical literary object brought to life digitally. The redesign elevates tactile material textures, bespoke vector iconography, classical letterpress typography, and an authentic dual-page spread (Ex Libris and Table of Contents), while eliminating redundant surrounding cards to make the book the focal centerpiece of the hero stage.

---

### Key Architectural & Design Upgrades

#### 1. Tactile Cover Materials & Binding ([`src/app/globals.css`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/app/globals.css))
- **Midnight Buckram Cloth (`.book-cloth-permanent`)**: Deep obsidian/charcoal canvas (`#121316`) textured with subtle linen cross-weave radial gradients and an angled specular sheen.
- **Spine Joint French Groove (`.french-groove`)**: Indented 12px vertical hinge crease alongside the spine featuring realistic dual shadow (`#000000 65%`) and highlight rays (`#ffffff 10%`).
- **Blind Debossing & Inset Framing Rules**: Dual concentric gold hairline borders with corner radii recessed into the cloth face.
- **Gold Foil Stamping (`.gold-foil-stamp`)**: Warm, authentic metallic leaf sheen (`#ecd49c` to `#cfa85b`) with micro drop shadows and sub-pixel letterpress highlights.
- **Deckled Fore-Edge Pages & Headbands**: 22px 3D page leaf block with layered deckle-edge paper texture and traditional dual-tone silk endbands at head and tail.

#### 2. Closed Cover Identity & Composition ([`src/components/landing/PhysicalBook.tsx`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/components/landing/PhysicalBook.tsx))
- **Permanent Publisher Identity**: Represents the permanent literary identity of the INKFORGE publishing house—not a temporary fictional book, fake awards, or invented stats.
- **Bespoke Publisher Crest SVG**: Diamond roundel featuring a centered fountain pen nib, smithing anvil motif, starburst rays (`✦`), and dashed astronomical ring.
- **Cover Typography**:
  - Top Imprint: `I N K F O R G E` stamped in gold foil with `0.4em` tracking above `Publishing House & Digital Press`.
  - Center Cartouche: `A Living Digital Book` / `The Sovereign Written Word` in classical Charter serif with high-contrast drop-shadows.
  - Epigraph Motto: *“To write with discipline, to publish with permanence, and to treat digital literature with stillness.”*
  - Edition Line: `Continuous Archival Edition • MMXXVI`.
- **Letterpress Bookplate Inset Button**: Replaced generic pill buttons with an authentic debossed bookplate inset reading `Unfold Volume [Open →]` with clear keyboard guidance (`Enter`).

#### 3. Inside Spread Polish: Ex Libris & Table of Contents
- **Folio I (Inside Left Page — Ex Libris)**:
  - Running Header: `EX LIBRIS` • `THE COLOPHON` • `FOLIO I`.
  - Woodcut Vignette: Handcrafted medallion icon with the editorial preface manifesto.
  - Authentic Architectural Pillars: Replaced placeholder metrics with platform pillars: **Charter** (Digital Typeset) and **Permanent** (Archival Imprint).
  - Folio Controls: Accessible `Close Volume (Esc)` button and direct link into the Lead Monograph.
- **Folio II (Inside Right Page — Index Capitulorum)**:
  - Classical Running Header: `LIBER PRIMUS` • `INDEX CAPITULORUM` • `FOLIO II`.
  - Chapter Items: 6 primary destinations (`Read`, `Discover`, `Write`, `Collections`, `Authors`, `About`) styled with crisp Roman numerals (`I.`–`VI.`), serif titles, category badges, high-contrast dot leaders, and smooth hover/focus transitions.
  - Keyboard Navigation: Fully navigable with `Tab`, `Enter`, and `Space`.

#### 4. Hero Stage De-Cluttering ([`src/components/landing/InkforgeLanding.tsx`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/components/landing/InkforgeLanding.tsx))
- **Elimination of Competing Duplicate Cards**: Removed the block of 5 large cards immediately below the book that previously duplicated the top navigation header and the book's Table of Contents.
- **Refined Interaction Affordance**: Single contextual badge below the book allowing users to unfold or close the volume with one click or keyboard shortcut.
- **Seamless Flow**: The hero stage flows directly into the **Autumn Anthology Frontispiece Ribbon** and the Lead Monograph feature below.

#### 5. Preservation of Author Manuscript Modes
- Preserved all dynamic branches (`book ? ... : ...`) in [`PhysicalBook.tsx`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/components/landing/PhysicalBook.tsx).
- When a user inspects or edits an individual manuscript in `/books/[id]` or the `BookCreationWizard`, the component adapts to display their custom cloth colors, generated cover artwork, author byline, chapter counts, and studio tools.

---

### Verification Results

| Test / Check | Command | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Type Check** | `npx tsc --noEmit` | **PASS (Code 0)** | 0 TypeScript errors across the repository |
| **Production Build** | `npm run build` | **PASS (Code 0)** | All 15 static and dynamic routes compiled successfully |
| **Dev Server Runtime** | `http://localhost:3000` | **HEALTHY** | Servicing `GET /` with `200 OK` in ~78ms |
| **Backend Integrity** | `git status` audit | **PRESERVED** | Zero modifications to Prisma models, migrations, auth, or APIs |

---

### Modified Files Summary

1. [`src/app/globals.css`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/app/globals.css) — Added `.book-cloth-permanent`, `.french-groove`, `.letterpress-bookplate`, `.gold-foil-stamp`, `.fore-edge-pages`.
2. [`src/components/landing/PhysicalBook.tsx`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/components/landing/PhysicalBook.tsx) — Redesigned permanent cover face, publisher crest SVG, letterpress button, Ex Libris endpaper, and Table of Contents right page.
3. [`src/components/landing/InkforgeLanding.tsx`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/components/landing/InkforgeLanding.tsx) — Streamlined hero stage, removed redundant card clump beneath book, enhanced contextual helper button.

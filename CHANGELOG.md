# INKFORGE — Release Changelog

## [0.5.0] — 2026-10-08

### Enhanced: Realistic Physical 3D Book Reconstruction
- **Unified 3D Anatomy (`PhysicalBook.tsx`)**:
  - Replaced conditional component swapping with a continuous 3D physical book DOM hierarchy.
  - Implemented reversible hinged front cover board (`rotateY(0deg)` to `rotateY(-180deg)`) pivoting at the spine joint.
  - Added physical 22px stacked fore-edge paper block (`.fore-edge-pages`), head/tail edges, and traditional woven silk headbands (`.spine-headband`).
  - Added center binding gutter valley with sewn signature stitches (`.gutter-valley-shadow`).
  - Added dynamic desk cast shadow (`.desk-shadow-closed` to `.desk-shadow-open`) and camera stage auto-centering along `translateX`.
  - Added interactive mouse-tracking parallax tilt with reduced-motion fallback.
  - Responsive dynamic scale calibration supporting mobile through ultra-wide viewports.

## [0.4.0] — 2026-10-08

### Added: Signature Interactive Book Landing Page & Navigation System
- **Interactive Book Entry (`src/components/landing/InkforgeLanding.tsx`)**:
  - Introduced physical-digital book entry metaphor on root `/` that acts as the platform's primary spatial navigation portal.
  - Implemented 5-state lifecycle: `closed` → `opening` → `open` → `flipping` → `unveiled`.
  - Added responsive two-page spread (Desktop) and stacked leaf view (Tablet/Mobile).
  - Preserved complete non-destructive access to existing baseline Frontispiece, Gazetteer, and Anthology via smooth unveil mechanism.
- **Physical Details & 3D CSS Mechanics**:
  - `BookCover.tsx`: Blind-debossed cover frame, linen cloth texture, gold foil typography, silk bookmark ribbon, and tactile invitation to open.
  - `TableOfContents.tsx`: Classical folio layout with dot leaders, roman numeral chapter headings (I–VI), issue almanac stats (38 monographs, 142k words, 100% local persistence), and hover illumination.
  - `BookShell.tsx`: 2000px perspective stage, multi-layered deckled page edge shadows, embossed spine hinge, and center gutter light falloff.
  - `AuthorsModal.tsx` & `ColophonModal.tsx`: Lightweight editorial overlays for Chapters V and VI.
- **Persistent Access & Navigation**:
  - Added "Book Folio" link in the global [`Header.tsx`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/components/navigation/Header.tsx).
  - Added floating docked "Open Book Folio (Vol. IV)" badge on `/` when in unveiled state.
  - Keyboard accessibility (`Enter`/`Space` to open, `Escape` to close/dismiss).
  - Instant bypass buttons ("Direct to Gazetteer", "Skip to Full Experience") and `prefers-reduced-motion` compliance.
- **Documentation**:
  - Created [`docs/INTERACTIVE_BOOK_LANDING.md`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/docs/INTERACTIVE_BOOK_LANDING.md).

---

## [0.3.0] — 2026-10-07

### Added: Living Editorial Visual Master Pass
- Implemented Tri-Paper Tone System (Cotton Ivory, Bookshop Vellum, Midnight Buckram).
- Added Scribe Studio composition desk with distraction-free local-first autosave.
- Added Editorial Ledger (`/posts`) with genre filtering and archival folios.
- Added Flagship Reader view (`/read/[slug]`) with margin notes, drop-caps, and reading time estimation.

---

## [0.1.0] — 2026-10-07

### Initial Release
- Project initialization with Next.js 15, React 19, Tailwind CSS v4, and Prisma ORM.

# INKFORGE — Release Changelog

## [0.6.0] — 2026-10-08

### Added: AI Book Identity & Adaptive Cover Experience
- **Signature Feature: Every Piece of Writing Becomes a Book**:
  - Transitioned platform paradigm from simple post creation to rich, bound book authorship.
  - Manuscripts are bound with custom title, subtitle, author imprint, genre, synopses, and persistent visual identity.
- **AI-Assisted Cover Generation & Multi-Tier Art Engine**:
  - Architected provider abstraction ([`src/lib/cover-generator/service.ts`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/lib/cover-generator/service.ts)) with honest capability reporting.
  - Transparent support for Gemini API (`GeminiCoverProvider`) when `GEMINI_API_KEY` is present.
  - Zero-dependency built-in **Curated Editorial Art Engine** (`CuratedEditorialProvider`) generating rich SVG/Canvas fine-art compositions across 4 signature directions (`editorial`, `cinematic`, `experimental`, `classic`).
  - Negative space enforcement and strict prompt anti-text guidelines in [`prompt-builder.ts`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/lib/cover-generator/prompt-builder.ts).
- **Crisp Typographic Compositing Layer**:
  - Never bakes AI-hallucinated glyphs into raster images.
  - Composites tack-sharp HTML/CSS typography (Charter serif & Editorial mono) over generative art with foil finishes, linen cloth textures, and debossed framing.
- **Local-First Book Store & Version Archive**:
  - Reactive local storage persistence ([`src/lib/book-store.ts`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/lib/book-store.ts)).
  - Non-destructive cover versioning (`CoverVersion[]`) allowing infinite branching, version comparison, and restoration.
- **Adaptive Creator Workspace Menu**:
  - Upgraded 3D Physical Book (`PhysicalBook.tsx`) inside spread to render contextual workspace menus based on manuscript state (`NEW`, `IN_PROGRESS`, `READY_TO_PUBLISH`, `PUBLISHED`).
  - Seamless navigation to Scribe Studio (`/write?bookId=...`), Outline, Notes, Cover Archive, and Reader Preview.
- **New Routes & Integration**:
  - `/books/create`: 3-step creation wizard (Manuscript Dossier → Direction Choice → Cover Identity Studio).
  - `/books/[id]`: Dedicated 3D physical book workspace.
  - Scribe Studio (`/write`): Displays active volume spine banner and synchronizes word counts to book identity.
  - Editorial Ledger (`/posts`): Features "Bound Volumes & Custom Editions" shelf with 3D/flat preview cards.
  - Global Header (`Header.tsx`): Prominent "New Book" action CTA.
- **Documentation**:
  - Added [`docs/BOOK_IDENTITY.md`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/docs/BOOK_IDENTITY.md) and [`docs/AI_COVER_GENERATION.md`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/docs/AI_COVER_GENERATION.md).

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

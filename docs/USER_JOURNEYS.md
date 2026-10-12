# INKFORGE — Complete User Journeys Handbook

This handbook provides exhaustive step-by-step guides for the 15 primary user workflows through INKFORGE. Every journey specifies starting routes, exact control names, visible UI feedback, backend operations, and known failure edge cases.

---

## Journey Index

1. [New Visitor Exploring the Homepage](#journey-1-new-visitor-exploring-the-homepage)
2. [Creating an Account & Signing In](#journey-2-creating-an-account--signing-in)
3. [Creating a New Manuscript](#journey-3-creating-a-new-manuscript)
4. [Opening & Editing an Existing Manuscript](#journey-4-opening--editing-an-existing-manuscript)
5. [Autosaving Prose & Recovering from a Version Conflict (409)](#journey-5-autosaving-prose--recovering-from-a-version-conflict-409)
6. [Reviewing Previous Revisions & Restoring a Snapshot](#journey-6-reviewing-previous-revisions--restoring-a-snapshot)
7. [Publishing a Manuscript to the World](#journey-7-publishing-a-manuscript-to-the-world)
8. [Opening & Experiencing the Public Reading Folio](#journey-8-opening--experiencing-the-public-reading-folio)
9. [Unpublishing a Work Back to Private Draft](#journey-9-unpublishing-a-work-back-to-private-draft)
10. [Discovering Monographs, Essays & Authors](#journey-10-discovering-monographs-essays--authors)
11. [Creating & Managing Thematic Collections](#journey-11-creating--managing-thematic-collections)
12. [Viewing & Editing an Author Profile](#journey-12-viewing--editing-an-author-profile)
13. [Changing Reading Themes & Typographic Scales](#journey-13-changing-reading-themes--typographic-scales)
14. [Using INKFORGE on a Smartphone (Mobile Touch Experience)](#journey-14-using-inkforge-on-a-smartphone-mobile-touch-experience)
15. [Navigating Backward from Nested Folios to Previous Libraries](#journey-15-navigating-backward-from-nested-folios-to-previous-libraries)

---

## Journey 1: New Visitor Exploring the Homepage

- **Starting Page:** `/` (INKFORGE Homepage)
- **Sequence of Actions:**
  1. The visitor arrives at the homepage and observes the 3D book centered on the desk stage, the masthead *"Write. Publish. Discover. Read."*, and the theme indicator.
  2. The visitor hovers over or taps the book cover, observing the specular lighting sheen reflection (`.book-cover-sheen`) and the 3D lift-off elevation (`translateZ(28px)`).
  3. The visitor clicks the book cover or presses `Enter`.
  4. The 3D cover unfolds along its spine (`rotateY(-180deg)`), revealing the Table of Contents on the right folio and the Colophon on the left folio.
  5. The visitor inspects the six chapters in the Table of Contents:
     - Chapter I: Read: The Lead Monograph
     - Chapter II: Discover: Stories & Catalog
     - Chapter III: Write: Scribe Studio Desk
     - Chapter IV: Collections: Thematic Folios
     - Chapter V: Authors: The Collegium
     - Chapter VI: About: Manifesto & Colophon
  6. The visitor clicks "Chapter I: Read: The Lead Monograph".
- **Expected Destination:** `/read/crafting-systems-that-endure`
- **Visible Feedback:** Smooth 3D page turn transition followed by instantaneous navigation to the long-form reading folio.
- **Backend Operations:** None on homepage; standard SSR page fetch for `/read/crafting-systems-that-endure`.
- **Failure Cases & Mitigation:** If WebGL or 3D transforms are slow on low-end hardware, CSS hardware acceleration (`will-change: transform`) ensures a smooth 60fps rotation; if the user has `prefers-reduced-motion: reduce`, the book unfolds instantaneously without rotation.

---

## Journey 2: Creating an Account & Signing In

- **Starting Page:** Any page with the application header (e.g., `/`).
- **Sequence of Actions:**
  1. In the top-right header, click the **"Account"** button.
  2. The `SignInModal` dialog opens in `signin` mode with a darkened backdrop blur.
  3. Click **"Need to register? Create author folio"** at the bottom of the modal.
  4. The modal transitions to `register` mode.
  5. Enter Email (`author@independentpress.org`), Username (`elena-rostova`), Display Name (`Elena Rostova`), and Password (min 8 characters).
  6. Click **"Create Author Account"**.
  7. The submit button displays an animated spinner with *"Authenticating..."*.
  8. Upon completion, the modal does *not* abruptly close; it renders an explicit confirmation view with a green checkmark and *"Author folio created successfully! Your credentials are now active in the INKFORGE registry."*
  9. Click **"Proceed to Sanctuary"** or press `Escape`.
- **Expected Destination:** Modal closes; the header immediately updates to show the author's initials circle avatar, display name, and unverified/verified status.
- **Backend Operations:**
  - `POST /api/v1/auth/register` creates `User` and `Profile` in database, hashes password, and issues `session_token` cookie.
  - Window event `inkforge_auth_change` triggers `checkAuth()` in `Header.tsx`.
- **Failure Cases:**
  - *Email already registered:* Modal remains open, input fields are preserved, and an alert banner shows: *"An author with this email already exists."*
  - *Password too short:* Native HTML5 and Zod schema reject passwords under 8 characters with explicit field feedback.

---

## Journey 3: Creating a New Manuscript

- **Starting Page:** `/posts` (Author's Manuscript Dashboard) or Navigation Header.
- **Sequence of Actions:**
  1. In the header or dashboard, click **"Write"** or **"Write New Piece"**.
  2. If navigating from `/posts`, click the **"Create New Monograph"** button.
  3. The browser navigates to `/write`.
  4. Scribe Studio initializes with a blank manuscript canvas, placeholder text, and word count set to 0 (*"Blank Leaf"*).
  5. Enter the title: *"On the Nature of Digital Solitude"*.
  6. Enter the subtitle: *"An Inquiry into Stillness in the Age of Constant Connection"*.
  7. Click the body canvas and compose the opening paragraph.
  8. Observe the bottom status strip update in real time: word count increments, reading time calculates, and the save pulse animates: *"Preserving to ledger..."* $\rightarrow$ *"Archived (hh:mm:ss)"*.
- **Expected Destination:** `/write?id=[newDocId]` (URL automatically updates via `window.history.replaceState` once the initial record is saved).
- **Backend Operations:**
  - Debounced `POST /api/v1/documents` creates the document with `status: "DRAFT"` and `version: 1`.
  - Database assigns a unique CUID, returned in the response.
- **Failure Cases:**
  - *Offline / Network Drop:* Scribe Studio detects fetch failure, falls back to `DraftManager.saveDraftLocal()`, and displays a blue badge: *"Buffered in Local Sanctuary"*. No prose is lost.

---

## Journey 4: Opening & Editing an Existing Manuscript

- **Starting Page:** `/posts` (Author's Manuscript Dashboard).
- **Sequence of Actions:**
  1. On the dashboard, locate the manuscript card titled *"On the Nature of Digital Solitude"*.
  2. Click the card or the **"Edit Manuscript"** button.
  3. The browser navigates to `/write?id=[docId]`.
  4. Scribe Studio loads the manuscript's Abstract Syntax Tree (AST), restoring title, subtitle, formatting, tags, and cursor position.
  5. Highlight a sentence and press `Cmd+B` to make it bold.
  6. Open the **"Insert"** popover on the toolbar and select **"Editorial Table"**.
  7. A 3-column structured comparative grid is inserted at the cursor.
  8. Type text into the table cells.
  9. Click **"Save"** or press `Cmd+S` to manually flush edits to the server.
- **Expected Destination:** Remains on `/write?id=[docId]` with green checkmark: *"Archived (hh:mm:ss)"*.
- **Backend Operations:** `PATCH /api/v1/documents/[docId]` sends updated AST JSON and expected `version`. Server saves revision and increments version number.
- **Failure Cases:**
  - *Unauthorized Access:* If a user attempts to edit a document owned by another author, the backend returns `403 Forbidden` and redirects to `/posts`.

---

## Journey 5: Autosaving Prose & Recovering from a Version Conflict (409)

- **Starting Page:** `/write?id=[docId]` (opened in two separate browser tabs).
- **Sequence of Actions:**
  1. In Tab A, type a new paragraph and press `Cmd+S`. Tab A saves Version 5 to the server.
  2. Switch to Tab B (which still has Version 4 loaded in memory).
  3. In Tab B, type an edit to a different section and trigger save.
  4. The server compares Tab B's expected version (4) with the database version (5) and rejects the update with HTTP `409 Conflict`.
  5. In Tab B, the save indicator bounces in oxblood: *"Version Conflict (409)"*.
  6. A prominent alert banner appears above the editor: *"Version Divergence Detected (Conflict 409) — A newer revision of this manuscript was saved from another browser tab or device."*
  7. The author reviews the three conflict resolution options:
     - **Option 1: "Keep My Changes (Overwrite)":** Overwrites server version with Tab B's content.
     - **Option 2: "Load Server Version":** Replaces Tab B with Tab A's remote version.
     - **Option 3: "Copy Local Prose":** Copies Tab B's text to the clipboard so the author can merge text manually.
  8. Click **"Keep My Changes"**.
  9. Scribe Studio forces an overwrite with an incremented version number, dismissing the conflict banner.
- **Expected Destination:** `/write?id=[docId]` with status restored to *"Archived"*.
- **Backend Operations:** Initial `PATCH /api/v1/documents/[docId]` returns `409`. Resolution `PATCH` uses the latest server version increment.

---

## Journey 6: Reviewing Previous Revisions & Restoring a Snapshot

- **Starting Page:** `/write?id=[docId]` (Active Manuscript).
- **Sequence of Actions:**
  1. In the studio action bar, click the **"Revisions"** button (history clock icon).
  2. The **Revision History Drawer** slides out from the right side of the screen.
  3. The drawer queries `GET /api/v1/documents/[docId]/revisions` and displays a chronological list of saved snapshots (e.g., *Version 4 • 1,420 words • 10 mins ago*).
  4. Click on *Version 2*.
  5. The preview pane displays the prose excerpt and word count from Version 2 alongside a side-by-side delta.
  6. Click the **"Restore Revision"** button.
  7. A confirmation dialog appears: *"Restore Version 2? Your current draft will be saved as a new revision before restoring."*
  8. Confirm the restoration.
- **Expected Destination:** The Scribe Studio editor canvas immediately reloads the content from Version 2 and triggers an automatic save creating Version 6.
- **Backend Operations:**
  - Retrieves revision snapshot from `PostRevision` table.
  - Updates active `Post` content and creates a new historical snapshot.

---

## Journey 7: Publishing a Manuscript to the World

- **Starting Page:** `/write?id=[docId]` (Draft with content).
- **Sequence of Actions:**
  1. Verify the manuscript title, subtitle, and body text.
  2. Click the **"Proof Mode"** (eye icon) button to preview the public typography, drop caps, and pullquotes.
  3. Click **"Exit Proof Mode"** to return to writing.
  4. In the studio action bar, click the **"Publish"** button.
  5. The button displays an animated spinner: *"Publishing..."*.
  6. Backend generates the URL slug and updates the document status from `DRAFT` to `PUBLISHED`.
  7. The **Publishing Celebration Modal** appears on screen, displaying:
     - Green seal: *"Monograph Successfully Inscribed into INKFORGE Press"*
     - Live Canonical URL: `https://inkforge-sigma.vercel.app/read/[slug]`
     - **"Copy Link"** button with instantaneous checkmark feedback.
     - **"Open Public Folio"** button.
  8. Click **"Open Public Folio"**.
- **Expected Destination:** `/read/[slug]` (Live public reading folio).
- **Backend Operations:**
  - `POST /api/v1/documents/[docId]/publish` updates `Post` record (`status = "PUBLISHED"`, `publishedAt = NOW()`).
  - Updates XML sitemap (`/sitemap.xml`) and search catalog.

---

## Journey 8: Opening & Experiencing the Public Reading Folio

- **Starting Page:** `/read/[slug]` (e.g., `/read/crafting-systems-that-endure`).
- **Sequence of Actions:**
  1. The page loads with classical book typography: Chapter kicker, Folio issue, large serif title, author byline with avatar, and publication credit.
  2. The visitor begins scrolling down the essay:
     - A hairline reading progress bar at the very top of the window tracks scroll percentage.
     - The first paragraph begins with a drop cap (`.drop-cap`).
  3. The visitor encounters an interactive footnote indicator `[1]`.
  4. Clicking `[1]` opens an archival sidenote popover displaying the citation: *"Donald Knuth, Computers & Typesetting, Vol. A: The TeXbook"*.
  5. In the floating utility controls:
     - Click the **Font Scale** toggle to enlarge text from *Standard* (18px) to *Generous* (23px).
     - Click **"Theme"** to switch the substrate to *Bookshop Vellum*.
     - Click the **"Solitary Mode"** icon to hide the navigation header for distraction-free immersion.
  6. At the bottom of the folio, click the **"Add to Collection"** button.
  7. The `AddToCollectionModal` opens, allowing the reader to save the essay into their private reading list.
  8. The reader clicks **"Next Chapter"** to continue reading Chapter II.
- **Expected Destination:** `/read/the-death-and-rebirth-of-the-independent-web`
- **Backend Operations:** `GET /api/v1/documents/by-slug/[slug]` fetches post, author profile, and publication data.

---

## Journey 9: Unpublishing a Work Back to Private Draft

- **Starting Page:** `/write?id=[docId]` (for an already published piece) or `/posts`.
- **Sequence of Actions:**
  1. In Scribe Studio, observe the status badge in the action bar: *"Published · Saved"*.
  2. Next to the status badge, click the **"Unpublish"** button (lock icon).
  3. A browser confirmation dialog appears: *"Are you sure you wish to unpublish this manuscript? It will be removed from public feeds and converted back into a private draft."*
  4. Click **OK**.
  5. The button animates with a spinner: *"Unpublishing..."*.
  6. The status badge transitions to *"Saved to Archive"* (Draft mode).
  7. The "Publish" button reappears in place of "Unpublish".
- **Expected Destination:** Remains on `/write?id=[docId]` in private draft state.
- **Backend Operations:** `POST /api/v1/documents/[docId]/unpublish` sets `status = "DRAFT"`, nullifies public visibility, and updates cache tags.
- **Verification:** Navigating to `/read/[slug]` as a logged-out visitor now returns a `404 Folio Not Found` error.

---

## Journey 10: Discovering Monographs, Essays & Authors

- **Starting Page:** Navigation Header.
- **Sequence of Actions:**
  1. Click **"Discover"** in the top navigation.
  2. The browser navigates to `/discover` (Literary Gazetteer).
  3. In the search bar at the top, type *"systems"*.
  4. The list of monographs updates live, filtering cards whose title, excerpt, or keywords match the query.
  5. Click the **"SYSTEMS CRAFT"** topic chip to further refine results.
  6. Adjust the Reading Time slider to *"Under 10 minutes"*.
  7. On the featured monograph card, click the author's byline *"Elena Rostova"*.
  8. The browser navigates to `/authors/elena-rostova`.
  9. The visitor reviews Elena's biography, affiliation, and complete catalog of 14 published monographs.
- **Expected Destination:** `/authors/elena-rostova`
- **Backend Operations:**
  - `GET /api/v1/documents?q=systems&category=SYSTEMS_CRAFT`
  - `GET /api/v1/authors/elena-rostova`

---

## Journey 11: Creating & Managing Thematic Collections

- **Starting Page:** `/collections` (Anthology Collections).
- **Sequence of Actions:**
  1. In the header, click **"Collections"**.
  2. Click the **"My Private Folios"** tab.
  3. Click the **"+ New Collection"** button.
  4. The `CreateCollectionModal` opens.
  5. Enter Title: *"Long-Horizon Software Studies"*.
  6. Enter Description: *"Curated essays on systems permanence, databases, and architectural craft."*
  7. Select Visibility: Toggle on *"Public Collection"* (visible to all readers).
  8. Click **"Create Collection"**.
  9. The collection appears in the sidebar and becomes the active selection.
  10. To add a monograph, open any reading page (e.g., `/read/crafting-systems-that-endure`), click the bookmark icon, select *"Long-Horizon Software Studies"*, and click **"Save to Collection"**.
  11. Return to `/collections` to see the essay listed with its reading time and sequence order.
- **Expected Destination:** `/collections` with active collection details pane.
- **Backend Operations:**
  - `POST /api/v1/collections` creates the collection.
  - `POST /api/v1/collections/[id]/items` associates the post with `orderIndex`.

---

## Journey 12: Viewing & Editing an Author Profile

- **Starting Page:** Header User Menu (when signed in).
- **Sequence of Actions:**
  1. Click the user avatar in the top-right header to open the profile dropdown.
  2. Click **"Edit Author Profile"**.
  3. The browser navigates to `/profile`.
  4. The page loads the current profile data via `GET /api/v1/auth/me`.
  5. Update the **Display Name** to *"Dr. Elena Rostova"*.
  6. Update the **Biography** with new research affiliations.
  7. Add **Website URL**: `https://rostova.archival.org`.
  8. Click the **"Save Profile"** button.
  9. The button displays an animated spinner: *"Saving..."* $\rightarrow$ Green checkmark: *"Author Folio Updated Successfully!"*.
  10. Click the **"View Public Profile"** link.
- **Expected Destination:** `/authors/elena-rostova` displaying updated credentials.
- **Backend Operations:** `PATCH /api/v1/auth/me` updates `displayName` in `User` and `bio`, `location`, `websiteUrl` in `Profile`.

---

## Journey 13: Changing Reading Themes & Typographic Scales

- **Starting Page:** Any page across INKFORGE.
- **Sequence of Actions:**
  1. Locate the **"Theme"** button in the navigation header (shows a paint palette icon and current color swatch).
  2. Click the button to open the Theme Selector dropdown.
  3. The dropdown displays three paper substrates:
     - **Cotton Ivory:** *Natural warm ivory newsprint* (Default)
     - **Bookshop Vellum:** *Warm amber antiquarian paper*
     - **Midnight Buckram:** *Library night cloth (Dark Mode)*
  4. Click **"Bookshop Vellum"**.
  5. The dropdown closes and the document root (`<html class="tone-vellum">`) immediately updates all CSS custom properties (`--paper-canvas`, `--paper-surface`, `--ink-primary`).
  6. Reload the browser or open a new tab.
  7. The page renders directly in *Bookshop Vellum* without flash-of-unstyled-theme, because the setting is stored in `localStorage` under `inkforge_paper_tone`.
- **Expected Outcome:** Persistent visual theme change applied across all 17 routes.

---

## Journey 14: Using INKFORGE on a Smartphone (Mobile Touch Experience)

- **Starting Page:** Mobile viewport on `/`.
- **Sequence of Actions:**
  1. The user opens INKFORGE on an iPhone or Android device.
  2. The mobile header presents a compact brand wordmark, theme selector button, and a $\ge 44\text{px}$ hamburger menu button.
  3. The 3D book is scaled to fit the mobile screen width ($340\text{px}$ to $390\text{px}$).
  4. The user swipes left across the book cover.
  5. The touch gesture handler measures $\Delta X \ge 45\text{px}$ and triggers a haptic pulse (`navigator.vibrate([15])`).
  6. The cover turns smoothly, presenting the mobile Table of Contents with large touch targets ($46\text{px}$).
  7. The user taps the hamburger menu icon in the header.
  8. A full-height drawer slides open with grouped navigation links (Primary Destinations, Explore The Archive, Author Folio, Mobile Theme Selector).
  9. Tap **"Write"** to enter mobile Scribe Studio:
     - The formatting toolbar supports horizontal swipe scrolling (`no-scrollbar touch-scroll`).
     - The bottom metrics strip adapts to mobile screen width without clipping.
- **Expected Outcome:** Full parity with desktop capabilities adapted for touch ergonomics.

---

## Journey 15: Navigating Backward from Nested Folios to Previous Libraries

- **Starting Page:** `/read/crafting-systems-that-endure` (reached via `/discover`).
- **Sequence of Actions:**
  1. The reader finishes reading the monograph.
  2. In the top-left subheader, locate the **"Return to Catalog"** back-arrow link.
  3. Click **"Return to Catalog"** (or press the browser's native Back button).
  4. The browser returns to `/discover`.
  5. The search query, active topic filter chip, and scroll position in `/discover` are preserved.
  6. Alternatively, click the **"INKFORGE"** brand wordmark in the header to return directly to the homepage root (`/`).
- **Expected Destination:** `/discover` or `/`.
- **Expected Outcome:** Fluid navigation continuity without dead ends or broken session states.

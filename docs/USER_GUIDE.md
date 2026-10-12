# INKFORGE — User Guide & Author Handbook

Welcome to the **INKFORGE User Guide**. This document outlines how readers, authors, and editors interact with the platform, from first exploring the interactive 3D centerpiece on the homepage to authoring monographs in Scribe Studio and publishing work to the world.

---

## 1. Editorial Vision & Aesthetic Foundations

INKFORGE is designed to bridge the tactile, sensory beauty of physical print with the dynamic capabilities of modern software.

### The Three Paper Editions
Every page in INKFORGE supports three distinct tactile paper tones via the navigation header:
1. **Cotton Paper Edition (`.tone-cotton`):** Natural warm ivory background (`#fbf9f4`) with crisp dark ink (`#171513`), echoing handset letterpress on cotton rag paper.
2. **Bookshop Vellum (`.tone-vellum`):** Warm amber newsprint tone (`#f4eee2`) with rich sepia ink (`#201a14`), inspired by vintage second-hand bookshops and natural parchment.
3. **Midnight Buckram (`.tone-inkwell` / `.dark`):** Deep library night cloth (`#0f1012`) with luminescent ivory text (`#f5f2ea`), providing an eye-resting dark mode without high-contrast glare.

Your selected paper tone persists automatically across browser sessions using `localStorage` and system preference detection.

---

## 2. The Interactive 3D Physical Book

The centerpiece of the INKFORGE homepage is an interactive 3D volume resting upon a virtual wooden desk.

```
+-----------------------------------------------------------+
|                      [ CLOSED BOOK ]                      |
|  - Real cloth buckram texture with debossed gold borders  |
|  - French groove hinge joint & silk bookmark ribbon       |
|  - Dynamic desk contact shadow beneath the boards         |
+-----------------------------------------------------------+
                             |
                   Tap Cover or Press [Enter]
                             |
                             v
+-----------------------------------------------------------+
|                       [ 3D LIFT-OFF ]                     |
|  - Elevates into Z-space (translateZ: 28px, float -10px)  |
|  - Contact shadow softens into a deep diffuse blur        |
|  - Specular lighting sheen glides across the front cloth  |
+-----------------------------------------------------------+
                             |
                     Cover Rotates -180°
                             |
                             v
+-----------------------------+-----------------------------+
|    FOLIO I: THE COLOPHON    |   FOLIO II: TABLE OF CONTENTS
|  - Ex Libris insignia       |  - Primary chapters / tools
|  - Editorial Preface quote  |  - Active item indicator
|  - Architectural metrics    |  - Instant jump navigation
+-----------------------------+-----------------------------+
```

### Desktop Interaction
- **Click or Press `Enter`:** Unfolds the volume into the 2-page spread.
- **Mouse Movement:** Subtly tilts the volume with realistic perspective parallax (`rotateX` and `rotateY`).
- **Chapter Selection:** Click any chapter item in Folio II to navigate directly to that destination.
- **Closing Volume:** Press `Esc` or click the &ldquo;Close Volume&rdquo; button in the running header to fold the book back onto the desk.

### Mobile Phone Interaction
On smartphones, the 3D book is automatically scaled to fit the viewport comfortably with zero horizontal overflow:
- **Tap to Open:** Elevates and rotates open directly into the interactive **Folio II: Contents**.
- **Mobile Folio Tabs:** Toggle between `Folio I: Colophon` and `Folio II: Contents` via pill buttons with tactile feedback.
- **Horizontal Swipe Gestures:** Swipe left to advance to Folio II; swipe right to return to Folio I.
- **Tactile Haptic Impulses:** Supported mobile devices produce subtle haptic vibrations (`navigator.vibrate`) on tab taps and folio transitions.
- **Folio Curl Hints:** Curved indicator tabs appear on the screen edges showing readers that an adjacent page is available to swipe.
- **Browser Back Button:** Pressing Android/iOS back button smoothly folds the book closed rather than jumping off the page unexpectedly.

---

## 3. Scribe Studio: Writing & Block Composition

Navigate to **`/write`** to enter INKFORGE's distraction-free writing environment.

### Editor Capabilities
- **Tiptap / ProseMirror Engine:** Writing is structured as an Abstract Syntax Tree (AST) rather than unstructured HTML, ensuring pure typographic fidelity across print, web, and e-ink.
- **Editorial Typography:** Typeset in Bitstream Charter with balanced line heights, hanging punctuation, and classical paragraph spacing.
- **Distraction-Free Focus Mode:** Click the Maximize icon to hide all navigation headers, sidebars, and toolbars, leaving only your sentences and the paper.
- **Editorial Proofreading Mode:** Toggle the Eye icon to view your essay exactly as a reader will see it before publishing.
- **Target Word Goals:** Set a target word count (default: 1,200 words) with real-time reading duration calculation.

---

## 4. AI Writing Copilot

Accessible via the Sparkles icon in the Scribe Studio toolbar:
- **Advisory Analysis:** The Copilot analyzes your prose for pacing, tone consistency, and clarity without overwriting your sentences without consent.
- **Tone Tuning:** Request adjustments such as &ldquo;More Academic&rdquo;, &ldquo;More Poetic&rdquo;, or &ldquo;Sharpen Argument&rdquo;.
- **Proofreading Assistance:** Identifies syntactical redundancies, passive phrasing, or inconsistent terminology.
- **Idea Expansion:** Generates relevant marginalia notes, epigraph suggestions, and concluding thoughts based on your active document tree.

---

## 5. Resilient Local-First Autosave & Revision History

INKFORGE guarantees that no author ever loses a sentence, even during network disconnects or browser crashes.

### Local-First Persistence
- Every keystroke is saved instantaneously to your device's persistent storage (`IndexedDB` / `localStorage`).
- A status badge in the studio header indicates live state:
  - `Saved locally`: Your draft is safely stored on your device.
  - `Syncing to cloud`: Background sync is securely transmitting changes to the database.
  - `All changes saved`: Local and remote cloud state are fully synchronized.

### Optimistic Concurrency & Conflict Prevention
- Every cloud save includes an incrementing `version` counter.
- If a draft is edited concurrently on another device, INKFORGE detects the divergence, prompts you before overwriting, and offers side-by-side reconciliation.

### Revision History Timeline
- Click the History clock icon in the studio toolbar to inspect past versions.
- Every major save or publish event creates an immutable snapshot with timestamp, word count, and excerpt.
- You can inspect past revisions and restore any snapshot with a single click.

---

## 6. Collections & Curated Reading Lists

Navigate to **`/collections`** to organize monographs into thematic boxsets and slipcases:
- **Public Anthologies:** Curate reading lists around topics (e.g., &ldquo;Systems Craft&rdquo; or &ldquo;Literary Autonomy&rdquo;) that any visitor can explore.
- **Personal Reading Lists:** Save works marked for later study; toggle visibility between Public and Private.
- **One-Click Bookmarking:** In Discover or Reader mode, tap the Bookmark icon on any story to immediately add it to one of your existing collections.

---

## 7. Publishing & Public Sharing

When your manuscript is complete:
1. Click **&ldquo;Publish Now&rdquo;** in Scribe Studio.
2. The platform generates a canonical slug, calculates estimated reading time, pre-renders HTML for rapid reader loading, and commits the monograph to the public catalogue.
3. A success modal presents you with your permanent URL (`https://inkforge-sigma.vercel.app/read/[slug]`) and a one-click copy button.
4. If you ever need to revise or retract your work, click **&ldquo;Unpublish&rdquo;** in the studio to safely return the work to private draft status.

# INKFORGE — Interactive Book Landing Page & Navigation System

## Architectural Overview

The **Interactive Book Landing Page** is a signature entry experience for **INKFORGE**. Instead of greeting authors and readers with a standard marketing SaaS hero layout, INKFORGE introduces an interactive physical metaphor:

> **A tactile, digital book resting on an ambient desk that serves as the platform's spatial navigation system.**

Critically, this design operates as an **entry and navigation portal** rather than forcing the entire functional application into a skeuomorphic book shell. Once a chapter is selected or when the user chooses to explore the live gazetteer, the interface transitions smoothly into the modern, high-velocity INKFORGE living editorial experience.

---

## 1. State Machine Architecture

The entry experience is governed by a robust state machine in [`src/components/landing/InkforgeLanding.tsx`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/components/landing/InkforgeLanding.tsx):

```mermaid
stateDiagram-v2
    [*] --> Closed: Initial Visit
    Closed --> Opening: Click / Press Enter / Open Cue
    Opening --> Open: 400ms 3D Page Turn
    Open --> Closed: Close Cover / Esc
    Open --> Flipping: Select Chapter I / III / IV (Link)
    Flipping --> NavigationDestination: Route Transition
    Open --> Unveiled: Select Chapter II (Discover) / Direct Bypass
    Open --> ModalActive: Select Chapter V (Authors) / VI (Colophon)
    ModalActive --> Open: Dismiss Modal / Esc
    Unveiled --> Open: Click Docked Book Folio Badge
```

### State Definitions
1. **`closed`**: The volume rests on the editorial desk. Displays the blind-debossed cover, cloth texture, Volume IV gold foil typography, silk bookmark ribbon, and tactile invitation to open.
2. **`opening`**: Performs a smooth CSS 3D perspective fold (`rotateY`), transitioning into the spread.
3. **`open`**: Renders the complete two-page editorial spread:
   - **Left Page (Folio 1)**: Colophon, Volume Inscription, Frontispiece vignette, and issue statistics (38 monographs, 142k words, 100% local persistence).
   - **Right Page (Folio 2)**: The Table of Contents (Chapters I through VI) featuring roman numerals, dot leaders, folio numbers, and interactive hover illumination.
4. **`flipping`**: Momentary leaf-turn feedback preceding navigation to `/read/[slug]`, `/write`, or `/posts`.
5. **`unveiled`**: Unveils the full baseline Frontispiece, Gazetteer, and Anthology on `/`. Retains an elegant floating **"Open Book Folio (Vol. IV)"** badge for quick re-entry at any moment.

---

## 2. Chapter Navigation Index

The Table of Contents maps directly to INKFORGE's core editorial workflows:

| Chapter | Title | Folio | Destination | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **I** | **The Lead Monograph** | pp. 14–28 | `/read/crafting-systems-that-endure` | Opens flagship longform essay in reader view |
| **II** | **Gazetteer & Anthology** | pp. 29–64 | Unveil on `/` | Seamlessly reveals the live frontispiece & anthology |
| **III** | **Scribe Studio Desk** | pp. 65–88 | `/write` | Enters local-first distraction-free block composition |
| **IV** | **Editorial Ledger** | pp. 89–110 | `/posts` | Enters archival catalog & filterable publication ledger |
| **V** | **Resident Authors & Fellows** | pp. 111–124 | `AuthorsModal` | Displays resident collegium, author bios, and monographs |
| **VI** | **Colophon & Manifesto** | pp. 125–130 | `ColophonModal` | Displays living editorial manifesto & typographic rules |

---

## 3. Physical Book Anatomy & 3D Mechanics

The reconstructed implementation abandons UI-element swapping in favor of a **genuine physical 3D book object** ([`src/components/landing/PhysicalBook.tsx`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/components/landing/PhysicalBook.tsx)):

1. **Persistent 3D DOM Hierarchy**:
   - The Front Cover Board and the Page Block exist within the **same continuous 3D tree**.
   - Opening the book physically rotates the front cover board around its left spine hinge (`transform-origin: 0% 50%`) by $-180^\circ$ over 1050ms using a weighted easing curve (`cubic-bezier(0.22, 1, 0.36, 1)`).
   - Underneath, the Table of Contents page block is revealed without any conditional mounting flickers.

2. **Reversible Cover Board with Dual Surfaces**:
   - **Front Face (Hardcover Exterior)**:
     - Authentic bookcloth linen cross-weave texture (`.book-cloth`).
     - 3mm hardcover board thickness bevel (`.book-board-bevel`).
     - Inset blind-debossed frame with micro-shadows (`.debossed-frame`).
     - Hot-stamped metallic gold foil debossing (`.gold-foil-stamp`).
     - Spine hinge joint crease.
   - **Back Face (Inside Front Endpaper / Left Page)**:
     - Heavy cream vellum pastedown paper.
     - Woodcut frontispiece plate (`❦`), Scribe's Frontispiece title, and architectural epigraph.
     - Issue almanac metrics (38 Monographs, 142k Words, 100% Local Persistence, 2035+ Archival Horizon).
     - Controls to close the cover or proceed to the Gazetteer.

3. **3D Fore-Edge Paper Stack & Spine**:
   - **Right Fore-Edge**: Physical 22px paper stack with micro-striations representing hundreds of compressed leaves (`.fore-edge-pages`).
   - **Head & Tail Edges**: Top and bottom paper stack edges (`.head-edge-pages`).
   - **Traditional Woven Headbands**: Red and gold silk headbands capping both spine extremities (`.spine-headband`).
   - **Center Gutter Valley**: Concave shadow seam and visible sewn binding thread stitches (`.gutter-valley-shadow`).

4. **Dynamic Lighting, Shadows & Camera Choreography**:
   - **Desk Cast Shadow**: Dynamically morphs from a single-volume contact shadow (`.desk-shadow-closed`) into a wide two-board ambient shadow (`.desk-shadow-open`).
   - **Stage Centering**: The container automatically transitions along `translateX` ($ -215\text{px} \to 0\text{px}$), ensuring that both the closed book and the open spread remain centered in the viewport.
   - **Interactive Parallax Tilt**: Gentle mouse movements cast light across the foil and bookcloth surfaces.
   - **Responsive Viewport Scaling**: Automatic calculation scales the 3D book seamlessly across mobile, tablet, and ultra-wide screens without clipping.

---

## 4. Accessibility & Inclusive Design

- **Keyboard Navigation**:
  - `Enter` / `Space`: Opens the book from the cover.
  - `Tab` / `Shift+Tab`: Logical focus flow through all chapters.
  - `Escape`: Closes active modals or returns from the open spread to the cover.
- **Fast-Path Bypass**:
  - Impatient readers can immediately click **"Direct to Gazetteer"** or **"Skip to Full Experience"** in the top banner and footer to bypass 3D animations.
- **`prefers-reduced-motion` Support**:
  - Automatically suppresses 3D rotations, replacing them with instantaneous cross-fades for users who experience vestibular discomfort.
- **Screen Reader Support**:
  - Clear `role="button"`, `role="dialog"`, `aria-modal="true"`, and descriptive `aria-label` tags.

---

## 5. Non-Destructive Guarantee

The interactive book sits strictly in front of the approved visual baseline:
- No existing routes (`/`, `/read/[slug]`, `/write`, `/posts`) were deleted, altered, or restricted.
- The complete Gazetteer, Daily Dispatches, Contemporary Anthology, Thematic Slipcases, and Scribe Ledger on `/` remain fully functional when unveiled.
- A "Book Folio" link in the global [`Header.tsx`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/components/navigation/Header.tsx) ensures persistent access from anywhere in the application.

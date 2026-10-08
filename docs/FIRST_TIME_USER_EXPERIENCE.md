# INKFORGE — First-Time User Experience (FTUE) Design Guide

**Version**: 0.8.0  
**Target Metric**: 100% First-Time User Clarity  
**Benchmark**: A new visitor must grasp purpose and take their first action within 10 seconds.

---

## 1. The Core Timed Usability Tests

Every design choice on the INKFORGE landing page and navigation surfaces must satisfy these four empirical tests:

### Test 1: The 3-Second Test ("What is this website?")
* **User Question**: What kind of product is this?
* **Design Solution**:
  * The masthead banner declares in high-contrast editorial typography:
    > **"Write. Publish. Discover. Read."**
  * Sub-header: *"A living digital book for the modern internet. Independent long-form publishing, distraction-free writing, and carefully curated reading."*
* **Pass Condition**: The user immediately knows this is a digital publishing and reading platform, not an ecommerce shop, crypto app, or generic text editor.

### Test 2: The 5-Second Test ("What can I do here?")
* **User Question**: What are the main actions available to me right now?
* **Design Solution**:
  * Three prominent Primary Action Cards sit directly below the hero book:
    1. **Read**: *"Immerse yourself in carefully typeset long-form treatises with marginalia and progress tracking."*
    2. **Discover**: *"Explore our living catalog by theme, author, and reading time across independent publications."*
    3. **Write**: *"Enter the distraction-free Scribe studio. Draft, format, and publish with complete creative sovereignty."*
* **Pass Condition**: The user identifies the primary trio: **READ · DISCOVER · WRITE**.

### Test 3: The 10-Second Test ("How do I write something?")
* **User Question**: I want to start typing or publishing—where do I click?
* **Design Solution**:
  * Pinned top-right header button: **"Write"** (ink-filled dark button with feather pen icon).
  * Center hero card: **"Write"** with explicit button **"Open Scribe Studio →"**.
  * Quick banner CTA: **"Start Writing"**.
* **Pass Condition**: The user identifies the writing action within one scan and can initiate it in a single click.

### Test 4: The 15-Second Test ("What is the book animation?")
* **User Question**: Why is there a 3D book on my screen?
* **Design Solution**:
  * Sub-label on book stage: *"Signature Opening Experience — Click or drag to open the volume"*.
  * The book acts as an engaging tactile entryway and identity centerpiece, but **does not hide** the rest of the application.
  * Direct links to all sections are immediately visible below the book stage without requiring interaction.
* **Pass Condition**: The user perceives the 3D book as an artistic, interactive metaphor rather than an annoying gatekeeper or obstacle.

---

## 2. Information Flow & Layout Rhythm

The landing page follows a natural vertical progression designed for both eager explorers and intentional searchers:

```
[ Top Header: Logo + Obvious Nav Links (Read, Discover, Write, Help) + Sign In ]
                                     ↓
[ Hero Masthead: "Write. Publish. Discover. Read." + Platform Description ]
                                     ↓
[ 3D Living Book Stage: Tactile physical book with open/flip interaction ]
                                     ↓
[ Level 1 Action Cards: READ (Flagship) | DISCOVER (Catalog) | WRITE (Scribe) ]
                                     ↓
[ Level 2 Discovery Row: COLLECTIONS (Curated Folios) | AUTHORS (Directory) ]
                                     ↓
[ Level 3 Utility Strip: HELP & FAQ | ABOUT INKFORGE | SIGN IN ]
                                     ↓
[ Editorial Anthology: Published monographs, dispatches, and reading previews ]
                                     ↓
[ Footer Colophon: Typographic details, license, and platform principles ]
```

---

## 3. Microcopy Standards & Plain Language Rules

To maintain high readability and trust, interface copy follows these mandatory principles:

1. **Active, Clear Verbs**: Use "Start Writing", "Browse Catalog", "Read Essay", "Search FAQs" instead of "Excavate", "Transcribe", "Consult", "Commune".
2. **Honest Time Indicators**: Always display estimated reading time (e.g. `8 min read`) to set clear expectations before a user clicks.
3. **No Dead Ends**: If a search or filter yields zero results in `/discover`, provide a helpful reset button and suggest popular topics (*Systems Craft*, *Literary Ecology*).
4. **Local-First Reassurance**: In `/write` and sign-in dialogs, explicitly reassure users: *"Your drafts are saved locally in your browser first. No unexpected data loss."*

---

## 4. Accessibility & Inclusive Interaction

* **Keyboard Navigation**: All interactive cards, book controls, and navigation items are fully reachable via `Tab` and activatable via `Enter` / `Space`.
* **Focus States**: High-contrast, custom amber/ink focus rings (`focus-visible:ring-2 focus-visible:ring-[#2C241D]`) ensure clear visual cues.
* **Color Contrast**: All body text maintains a minimum contrast ratio of `7:1` against the warm parchment background (`#F9F8F6`), far exceeding WCAG AAA requirements.
* **Reduced Motion**: Respects `prefers-reduced-motion` media queries by disabling continuous floating animations on the 3D book and using instant transitions.

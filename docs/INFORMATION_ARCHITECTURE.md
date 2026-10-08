# INKFORGE — Information Architecture & Navigation Manifesto

**Version**: 0.8.0  
**Status**: Approved & Deployed  
**Core Directive**: *Simplify, Clarify & Elevate the Existing Experience*

---

## 1. Executive Summary & Core Product Principle

INKFORGE communicates one unmistakable truth:

> **"INKFORGE is a place to write, publish, discover, and read great work."**

Previous iterations over-indexed on literary terminology and complex interactions, obscuring essential product actions behind esoteric metaphors. Version 0.8.0 establishes a strict separation of concerns that restores effortless clarity for first-time visitors while preserving the platform's literary soul:

```
┌─────────────────────────────────────────────────────────────┐
│ BOOK        = Brand Identity + Hero Entrance + Emotion      │
│ NAVIGATION  = Transparent, Instantly Understandable Wayfinding│
│ APPLICATION = Fast, Responsive, Production Publishing Tools │
└─────────────────────────────────────────────────────────────┘
```

The book is an inviting physical centerpiece, not a navigational puzzle. The interface never traps the user or forces them to solve a riddle to read or write.

---

## 2. Navigation Hierarchy & Tiering

INKFORGE organizes all product surfaces into three unambiguous tiers of visual and functional priority:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: PRIMARY ACTIONS (High Contrast, Top Visual Weight)                   │
│                                                                               │
│   [ READ ]                 [ DISCOVER ]                 [ WRITE ]             │
│   Enter flagship reading    Browse curated catalog       Open distraction-free│
│   experience immediately   by theme and subject         editorial Scribe studio│
├───────────────────────────────────────────────────────────────────────────────┤
│ LEVEL 2: SECONDARY EXPLORATION (Medium Weight, Editorial Complements)         │
│                                                                               │
│   [ COLLECTIONS ]                           [ AUTHORS ]                       │
│   Thematic folios & compendiums             Resident writers & essayists      │
├───────────────────────────────────────────────────────────────────────────────┤
│ LEVEL 3: UTILITY & ORIENTATION (Quiet, Subtle Border/Text)                    │
│                                                                               │
│   [ HELP & FAQ ]           [ ABOUT INKFORGE ]           [ SIGN IN ]           │
│   Guides & shortcuts       Manifesto & philosophy       Local-first account   │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Level 1: Primary Actions
- **Read (`/read/crafting-systems-that-endure`)**: Direct doorway into long-form editorial reading with bespoke typography, progress tracking, annotations, and marginalia.
- **Discover (`/discover`)**: Curated discovery hub with real-time text query filtering, topic pills (*Systems Craft*, *Literary Ecology*, *Digital Theory*), reading time indicators, and catalog cards.
- **Write (`/write`)**: Immediate access to the Scribe writing studio with live typography preview, word counter, markdown support, and draft saving.

### Level 2: Secondary Exploration
- **Collections (`/collections`)**: Four thematic curated folios grouping related monographs (*On Craft & Systems*, *The Sovereign Writer*, *Block Semantics & Type*, *Digital Ecology & Solitude*).
- **Authors (`/authors`)**: Directory of resident authors with biographical profiles, institutional affiliations, monograph counts, and featured works.

### Level 3: Utility & Orientation
- **Help (`/help`)**: Categorized FAQ addressing Getting Started, Reading features, Writing studio, and Account persistence, with search filter and direct contact channels.
- **About (`/about`)**: The INKFORGE manifesto explaining what the platform is, why it was forged, the living book philosophy, colophon typography, and editorial values.
- **Sign In (`SignInModal`)**: Accessible modal providing distraction-free authentication via email magic link or local-first author keys.

---

## 3. Global Sitemap & Route Directory

| Route | Page Name | Primary Objective | Key Features |
|---|---|---|---|
| `/` | **Landing Page** | First-time orientation & entry | Hero masthead, 3D interactive physical book, 3-tier action cards, published anthology feed |
| `/read/[slug]` | **Monograph Reader** | Immersive reading experience | Charter serif typography, reading progress, marginalia notes, font sizing |
| `/discover` | **Discover Catalog** | Catalog exploration | Real-time search, category chips, curated reading recommendations |
| `/write` | **Scribe Studio** | Distraction-free writing | Live word count, local draft autosave, publishing workflow, markdown tools |
| `/collections` | **Collections** | Thematic browsing | 4 curated folios with monograph lists and estimated reading times |
| `/authors` | **Resident Authors** | Author discoverability | Bio cards, primary focus, list of published treatises |
| `/help` | **Help & FAQ** | Support & user orientation | Searchable FAQs, keyboard shortcuts cheat sheet, support channels |
| `/about` | **About & Manifesto** | Platform identity | The INKFORGE philosophy, colophon details, design principles |
| `/books/create` | **Book Identity Studio** | Manuscript binding | Cover generation engine, cloth bindings, author dossier |
| `/books/[id]` | **Book Workspace** | Dedicated volume shelf | Interactive volume view, chapter outline, reading stats |

---

## 4. Nomenclature & Vocabulary Reform

To eliminate cognitive friction, all pseudo-intellectual and obscure terms have been replaced with obvious, self-explanatory vocabulary:

| Deprecated / Obscure Term | Replacement | Rationale |
|---|---|---|
| `Gazetteer` | **Discover** | "Gazetteer" means a geographical index; users had no idea it was the catalog search. |
| `Index Rationis` | **Table of Contents** | Latin creates artificial elitism and obscures chapter navigation inside the 3D book. |
| `Excavate` | **Browse / Explore** | Confusing archaeological metaphor replaced with standard verb. |
| `Codex` | **Monograph / Essay** | Overly archaic; modern readers expect articles or essays. |
| `Editorial Ledger` | **Published Catalog / Posts** | "Ledger" implies financial accounting rather than reading material. |
| `Scriptorium Entrance` | **Start Writing** | Plain English button label ensures users know where to write in under 1 second. |

---

## 5. Responsive Behavior & Mobile IA

On mobile viewports (`< 768px`):
1. **Header**: Collapses secondary links into a clean, sliding drawer triggered by a dedicated menu button with clear aria attributes.
2. **Persistent CTA**: The "Write" button remains pinned in the header for 1-tap manuscript creation.
3. **Landing Page**: The 3D Physical Book gracefully scales down with touch-friendly swipe hints, and the Primary Action cards stack vertically with large tap targets (`> 48px`).
4. **Bottom Utility Bar**: Help and About links remain easily accessible without excessive scrolling.

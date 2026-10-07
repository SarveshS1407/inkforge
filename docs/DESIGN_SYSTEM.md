# INKFORGE — The Living Digital Book Design System

> **"A beautifully designed book that learned how to move."**
> The interface unifies: **Books + Paper + Editorial Design + Modern Digital Interaction + Lively Color + Premium Typography**.

---

## 1. Core Identity & Philosophy

INKFORGE is neither a sterile software SaaS tool nor a skeuomorphic novelty. It exists at the intersection of:
- **The Classical Book**: Structural margins, chapter hierarchy, folios, colophons, deckled edges, marginalia, silk bookmarks, and artisanal serifs.
- **The Living Web**: Seamless paper material morphing, fluid responsive reading scales, scroll-anchored progress ribbons, instant monograph archiving, and living digital typography.

---

## 2. The Tri-Paper Tone Material System

Unlike generic single-mode dark/light websites, Inkforge provides three distinct, historically inspired paper grounds:

| Material Ground | Tone Class | Canvas Ground | Surface Card | Primary Ink | Signature Accent | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cotton Paper (Day)** | `.tone-cotton` | `#fbf9f4` | `#ffffff` | `#171513` | `#831e26` (Oxblood) | Natural pressed ivory linen for daytime daylight reading |
| **Bookshop Vellum (Dusk)** | `.tone-vellum` | `#f4eee2` | `#faf6ee` | `#201a14` | `#99292d` (Crimson) | Warm sepia-toned newsprint reminiscent of antique bookstores |
| **Midnight Buckram (Night)** | `.tone-inkwell` / `.dark` | `#0f1012` | `#16171b` | `#f5f2ea` | `#cb3d4b` (Rose Red) | Archival library bookcloth with antique gold foil cues |

---

## 3. Typographic Hierarchy & The Living Grid

```
Monograph & Chapter Titles (Serif)  ──► Charter, Bitstream Charter, Cambria, Georgia
Editorial Navigation & Tools (Sans) ──► -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
Press Folios, ISBNs & Clocks (Mono) ──► ui-monospace, SF Mono, Cascadia Code, Menlo
```

### Classical Book Design Primitives
1. **Drop-Cap (`.drop-cap`)**: Large Charter initial glyph (3.75rem) balanced against opening line-height in signature oxblood ink.
2. **Book Jacket (`.book-jacket`)**: Tactile card with subtle spine groove shadow (`inset 4px 0 8px -2px rgba(0,0,0,0.08)`), evoking a hardcover volume.
3. **Silk Bookmark Ribbon (`.book-ribbon`)**: Ornamental grosgrain bookmark tab indicating active or bookmarked monographs.
4. **Marginalia Column**: Scholarly side annotations sitting gracefully in the right margin on wide viewports (Tufte style).
5. **Living Reading Bar**: Real-time 2.5px oxblood progress line dynamically tracking scroll completion.
6. **Adjustable Reading Typography**: Reader controls (`A` / `A+`) allowing comfortable scaling between standard and generous proportions.

---

## 4. The Editorial Ledger & Scribe Studio Desk

- **Live Prose Rhythm Analyzer**: Measures word count against literary benchmarks:
  - *Epigram / Sketch* (<300 words)
  - *Critical Essay* (300–800 words)
  - *Treatise* (800–1,800 words)
  - *Extended Monograph* (1,800+ words)
- **Sanctuary Autosave**: Continuous background persistence preventing data loss during network interruptions.
- **Galley Proof Estimation**: Live conversion from raw words into estimated print book pages (`~320 words/page`).

# INKFORGE — Living Editorial Design System

> **A Living Digital Book**: Editorial sophistication + modern digital energy + tactile book-inspired design.

---

## 1. Design Philosophy

Inkforge sits between two extremes:
- **Not Old-Fashioned**: No fake leather, antique parchment skeuomorphism, or medieval styling.
- **Not Cyber/SaaS**: No neon glowing borders, cyberpunk glassmorphism, or generic dashboard cards.
- **The Target: Living Editorial**: A contemporary, responsive publishing environment inheriting the disciplined typographic and layout traditions of classical book design while exploiting the dynamic responsiveness of digital media.

---

## 2. Color Tokens & Dual Edition System

Inkforge features two cohesive editions: **Paper Edition** (natural warm print daylight) and **Inkwell Edition** (night-bound midnight bookcloth).

| Token | Paper Edition (Day) | Inkwell Edition (Night) | Purpose |
| :--- | :--- | :--- | :--- |
| `--paper-bg` | `#fcfaf6` | `#111214` | Page ground canvas |
| `--paper-surface` | `#ffffff` | `#17181c` | Elevated content sheets |
| `--paper-card` | `#f7f4ed` | `#1d1e22` | Marginalia & tool ribbons |
| `--paper-border` | `#e6e0d2` | `#2b2c32` | Structural borders |
| `--ink-primary` | `#181716` | `#f5f2eb` | Titles, body text, primary prose |
| `--ink-secondary` | `#48453f` | `#c4c0b6` | Subtitles, author bios, excerpts |
| `--ink-muted` | `#6e6a62` | `#8d8980` | Folios, dates, metadata, indices |
| `--oxblood` | `#86212b` | `#c93b48` | Primary editorial accent & drop caps |
| `--amber-gold` | `#b37e22` | `#d89f36` | Secondary collection / volume accent |
| `--editorial-rule` | `#ded7c8` | `#28292e` | Hairline dividers & book rules |

---

## 3. Typography Foundation

```
Prose & Titles (Serif)     ──► Charter, Bitstream Charter, Cambria, Georgia
Controls & System (Sans)   ──► -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
Folios & Registry (Mono)   ──► ui-monospace, SF Mono, Monaco, Cascadia Code
```

- **Serif Scale**:
  - Main Title: `text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.06]`
  - Chapter Heading: `text-2xl sm:text-3xl font-bold`
  - Body Prose: `font-editorial-serif text-lg leading-[1.88]`
- **Classical Book Typographic Primitives**:
  - Initial Drop-Cap: `.drop-cap` (Charter, 3.5rem, line-height 0.82, colored in oxblood)
  - Pullquote: `.editorial-pullquote` (Italic, 1.35rem, 2.5px oxblood left rule)
  - Book Divider: `.editorial-divider` (Centered ornamental glyph `✦ • ✦` with hairline rules)
  - Running Folios: Tracked smallcaps (`font-editorial-mono text-[10px] tracking-widest uppercase`)

---

## 4. Components & Elevation

- **Paper Sheet (`.paper-sheet`)**: Tactile paper card with subtle double-shadow (`var(--shadow-paper)`), elevating slightly on hover without ostentatious 3D effects.
- **Buttons**: Structured with consistent `rounded-md` corners, uppercase letterspaced sans-serif type, and tactile press feedback (`active:scale-[0.98]`).
- **Interactive Reading Progress Bar**: 2.5px hairline bar fixed to viewport top dynamically visualizing scroll completion.
- **Adjustable Reading Typography**: Reader controls (`A` / `A+`) allowing comfortable scaling from standard to generous line heights.
- **Scribe Desk Autosave Sanctuary**: Live background persistence guaranteeing zero manuscript data loss.

---

## 5. Accessibility & Contrast Compliance

- All text contrast ratios strictly exceed WCAG AA standards in both Paper and Inkwell editions.
- Reduced motion: Micro-interactions utilize soft cubic bezier transitions (`0.2s cubic-bezier(0.16, 1, 0.3, 1)`).

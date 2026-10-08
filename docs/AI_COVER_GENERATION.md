# INKFORGE — Real AI Book Cover Generation Engine

## Core Philosophy

> **"Every book should look like its story."**

In INKFORGE, the book cover is not a generic stock image or random CSS gradient pasted behind a title. It is the **visual fingerprint of the manuscript**.

The AI understands:
- Book title and subtitle
- Deep story synopsis & narrative arc
- Genre and thematic field
- Emotional tone and mood
- Keywords & motifs
- Optional custom art direction from the author

It then translates that literary understanding into:
1. **Thematic Interpretation & Visual Metaphors**: Distinguishing between what a book is *called* (Title), what it is *about* (Subject), and how the subject is *symbolized* (Visual Metaphor).
2. **Production-Grade Cover Artwork**: High-contrast, portrait composition with strategic negative space.
3. **Crisp HTML/CSS Typography Overlay**: Perfectly spelled, editable, responsive Charter serif and Editorial mono typography with blind debossing and gold foil.
4. **Physical Binding Identity**: Cloth binding color, accent swatches, and foil finishes that skin the 3D interactive book.

---

## 1. System Architecture

All AI operations take place strictly server-side. No API keys, credentials, or secrets are ever exposed to the client.

```
Browser (Creator Studio)
   │
   │  1. Submit Manuscript Dossier (Title, Synopsis, Genre, Mood, Keywords, Direction)
   ▼
INKFORGE Server API Routes
   │
   ├─► Stage 1: /api/covers/interpret
   │     │
   │     ▼
   │   Cover Prompt Builder (System Instructions)
   │     │
   │     ▼
   │   Active LLM Provider (OpenAI GPT-4o-mini / Gemini 2.5 Flash)
   │     │
   │     ▼
   │   Structured VisualBrief (Subject, Themes, Metaphors, 4 Distinct Concepts)
   │
   ├─► Stage 2: /api/covers/generate
   │     │
   │     ▼
   │   Cover Image Prompt Builder (Negative space mandates, anti-text rules)
   │     │
   │     ▼
   │   Active Image Provider (OpenAI DALL-E 3 / Imagen 3)
   │     │
   │     ▼
   │   Asset Storage Manager (public/uploads/covers/ or Object Storage)
   │     │
   │     ▼
   │   Immutable CoverVersion Record
   ▼
Local-First Book Store (localStorage / Database)
   │
   ▼
3D Physical Book Folio (PhysicalBook.tsx) & Reading Workspace (/books/[id])
```

---

## 2. Two-Stage Generation Pipeline

### Stage 1: Visual Interpretation (`/api/covers/interpret`)
Rather than sending a raw book description directly to a diffusion model, Stage 1 uses a large language model to construct a structured `VisualBrief`:

```typescript
export interface VisualBrief {
  bookTitle: string;
  subject: string;            // Fundamental narrative distillation
  themes: string[];           // 5-7 core conceptual themes
  visualMetaphors: string[];  // 4-6 symbolic imagery elements
  emotionalTone: string[];    // Adjectives describing emotional gravity
  composition: string;        // Vertical balance & upper negative space rules
  palette: string[];          // Evocative color names
  style: string;              // Artistic movement or photographic aesthetic
  concepts: ConceptDirection[]; // 4 distinct concepts
}
```

#### The 4 Generated Concepts
Every manuscript automatically generates 4 distinct, story-derived concepts:
1. **Concept A: Visual Metaphor** — Profound conceptual symbol or abstraction reflecting the thematic conflict.
2. **Concept B: Character & Environment** — Atmospheric scene, physical setting, or solitary human presence.
3. **Concept C: Minimal Editorial** — Swiss grid discipline, restrained solitary motif, expansive negative space.
4. **Concept D: Cinematic & Atmospheric** — Chiaroscuro lighting, deep emotional chiaroscuro, sweeping horizon.

### Stage 2: Image Generation (`/api/covers/generate`)
Stage 2 synthesizes the artwork using the chosen concept, visual brief, and optional author refinements:
- **Portrait Orientation**: `1024x1792` (portrait book format).
- **Negative Space Enforcement**: The prompt strictly instructs the model to preserve tranquil negative space in the upper third for typography.
- **Strict Anti-Text Rule**: Mandatory prompt exclusion: *"ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS, NO TITLE PRINTED, NO SIGNATURES, NO LOGOS, NO WATERMARKS. Pure pictorial art only."*

---

## 3. Provider Abstraction

Providers implement the `CoverGenerationProvider` interface defined in [`src/lib/cover-generator/providers/provider.interface.ts`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/lib/cover-generator/providers/provider.interface.ts):

```typescript
export interface CoverGenerationProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  interpretBook(context: BookVisualContext, userDirection?: string): Promise<VisualBrief>;
  generateCoverImage(
    prompt: string,
    options?: { size?: "1024x1792" | "1024x1024"; quality?: "standard" | "hd" }
  ): Promise<{ imageUrl: string; model: string; revisedPrompt?: string }>;
}
```

### Supported Providers
- **`OpenAICoverProvider`**:
  - LLM: `gpt-4o-mini` (or `gpt-4o` via `OPENAI_CHAT_MODEL`)
  - Image: `dall-e-3` via `OPENAI_IMAGE_MODEL`
  - Auth: `OPENAI_API_KEY` in `.env`
- **`GeminiCoverProvider`**:
  - LLM: `gemini-2.5-flash`
  - Image: `imagen-3.0-generate-002`
  - Auth: `GEMINI_API_KEY` in `.env`

---

## 4. Environment Variables & Security

Configure in `.env`:

```env
# Primary Provider: OpenAI
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=dall-e-3

# Alternative Provider: Google Gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash
```

> [!CAUTION]
> Never prefix API keys with `NEXT_PUBLIC_`. Keys must remain exclusively in server environment variables. All requests must route through Next.js server route handlers.

---

## 5. Asset Storage Layer

Images generated by external APIs are immediately downloaded and persisted via [`src/lib/storage/cover-storage.ts`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/lib/storage/cover-storage.ts):
- Persists images to `public/uploads/covers/cover-[id].png`.
- Serves static assets at `/uploads/covers/cover-[id].png`.
- Prevents image expiration (OpenAI CDN URLs expire after 60 minutes).
- Ready for S3 / Cloud Storage adapter extensions.

---

## 6. Cover Versioning & Refinement

- **Zero Overwrite Rule**: Every generation or upload is assigned a new `CoverVersion` with a sequential version number, prompt copy, palette tokens, and provider attribution.
- **Refinement Pipeline**: Authors can adjust generation with quick refinement chips (*"Make it darker"*, *"More minimal"*, *"More cinematic"*, *"Emphasize scientific aspect"*) or custom prompt directions. Refinements modify the image prompt while preserving the underlying book story.
- **History Reel**: Authors can audition, switch between, compare, or delete versions without losing prior iterations.

---

## 7. Zero-Fake Policy & Unconfigured Fallbacks

INKFORGE strictly forbids fake AI generation:
- If `OPENAI_API_KEY` is not present, the system honestly reports status (`configured: false`).
- The UI presents 3 immediate, unblocked alternative choices:
  1. **Handcrafted Editorial Templates**: Oxford Navy Buckram, Bordeaux Heritage Cloth, Nordic Slate Linen, Bookshop Vellum.
  2. **Custom Upload**: Upload your own image file.
  3. **Plain Archival Cloth**: Bind in dignified plain buckram cloth immediately.

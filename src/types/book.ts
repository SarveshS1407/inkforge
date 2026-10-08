export type BookState = "NEW" | "IN_PROGRESS" | "READY_TO_PUBLISH" | "PUBLISHED";

export type CoverDirectionId = "editorial" | "cinematic" | "experimental" | "classic";

export type PaperTone = "cotton" | "vellum" | "inkwell";

export interface CoverDirection {
  id: CoverDirectionId;
  name: string;
  tagline: string;
  description: string;
  aesthetic: string;
  composition: string;
}

export const COVER_DIRECTIONS: CoverDirection[] = [
  {
    id: "editorial",
    name: "Minimal Editorial",
    tagline: "Clean typography, restrained imagery, ample negative space",
    description: "Inspired by European literary journals, avant-garde monographs, and independent press collections. Emphasizes typographic hierarchy, delicate rules, and quiet visual confidence.",
    aesthetic: "Swiss grid, restrained duotone, subtle paper grain, generous margins",
    composition: "Upper third negative space reserved for title, central abstract motif or quiet photographic horizon",
  },
  {
    id: "cinematic",
    name: "Cinematic & Atmospheric",
    tagline: "Dramatic visual storytelling, deep light, evocative depth",
    description: "Designed for sweeping narratives, speculative fiction, and emotional memoirs. Uses atmospheric chiaroscuro, evocative lighting, and deep emotional resonance.",
    aesthetic: "Moody chiaroscuro, sweeping textures, dramatic environmental lighting",
    composition: "Deep vertical perspective, lower focal density, evocative horizon with typographic illumination",
  },
  {
    id: "experimental",
    name: "Experimental & Contemporary",
    tagline: "Unusual composition, conceptual forms, modern tension",
    description: "For boundary-pushing essays, philosophical treatises, and cutting-edge poetry. Explores deconstructed geometric forms, risograph textures, and bold visual tensions.",
    aesthetic: "Deconstructed geometries, risograph tactile textures, asymmetrical balance",
    composition: "Diagonal tension, off-center focal anchors, high-contrast framing",
  },
  {
    id: "classic",
    name: "Classic Literary",
    tagline: "Sophisticated traditional binding, embossed framing, gold foil",
    description: "Inspired by timeless private press editions, leatherette buckram library bindings, and archival classics. Features gold foil stamping, blind-debossed framing, and enduring gravitas.",
    aesthetic: "Gilded foil deboss, blind-stamped borders, classical woodcut roundels",
    composition: "Centered symmetrical architecture, ornamental filigree, prominent classical roman titling",
  },
];

export interface CoverPalette {
  clothColor: string;
  accentColor: string;
  foilColor: string;
  paperTone: PaperTone;
  textColor: string;
}

export interface CoverTypography {
  titleFont: "serif" | "sans" | "mono";
  style: "debossed-gold" | "blind-embossed" | "modern-clean" | "classic-framed";
}

export interface CoverVersion {
  id: string;
  versionNumber: number;
  directionId: CoverDirectionId;
  imageUrl?: string;
  generatedPrompt?: string;
  palette: CoverPalette;
  typography: CoverTypography;
  artworkSource: "ai" | "template" | "upload" | "curated";
  createdAt: string;
  notes?: string;
  provider?: string;
  model?: string;
  conceptName?: string;
}

export interface ChapterItem {
  id: string;
  title: string;
  order: number;
  wordCount: number;
  excerpt?: string;
  status: "DRAFT" | "REVISED" | "FINAL";
}

export interface BookIdentity {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  genre: string;
  mood: string;
  keywords: string[];
  writingStyle?: string;
  intendedAudience?: string;
  visualThemes: string[];
  tone: string;
  coverDirection: CoverDirectionId;
  cover: {
    currentVersionId: string;
    versions: CoverVersion[];
  };
  chapters: ChapterItem[];
  notesCount: number;
  state: BookState;
  createdAt: string;
  updatedAt: string;
}

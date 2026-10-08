export type BookState = "closed" | "opening" | "open" | "flipping" | "unveiled";

export interface BookChapter {
  id: string;
  roman: string;
  title: string;
  subtitle: string;
  actionType: "link" | "unveil";
  href: string;
  folio: string;
  category: string;
}

export const BOOK_CHAPTERS: BookChapter[] = [
  {
    id: "read",
    roman: "I",
    title: "Read: The Lead Monograph",
    subtitle: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
    actionType: "link",
    href: "/read/crafting-systems-that-endure",
    folio: "6 min read",
    category: "READING EXPERIENCE",
  },
  {
    id: "discover",
    roman: "II",
    title: "Discover: Stories & Catalog",
    subtitle: "Explore essays across systems craft, digital ecology, and philosophy",
    actionType: "link",
    href: "/discover",
    folio: "Catalog",
    category: "DISCOVER",
  },
  {
    id: "write",
    roman: "III",
    title: "Write: Scribe Studio Desk",
    subtitle: "Distraction-free block composition with local-first autosave",
    actionType: "link",
    href: "/write",
    folio: "Studio",
    category: "CREATOR",
  },
  {
    id: "collections",
    roman: "IV",
    title: "Collections: Thematic Folios",
    subtitle: "Anthologies gathered around enduring software, typography, and solitude",
    actionType: "link",
    href: "/collections",
    folio: "4 Volumes",
    category: "COLLECTIONS",
  },
  {
    id: "authors",
    roman: "V",
    title: "Authors: The Collegium",
    subtitle: "The thinkers, researchers, and essayists behind the published work",
    actionType: "link",
    href: "/authors",
    folio: "Fellows",
    category: "AUTHORS",
  },
  {
    id: "about",
    roman: "VI",
    title: "About: Manifesto & Colophon",
    subtitle: "Why INKFORGE exists: on permanence, typography, and the living book",
    actionType: "link",
    href: "/about",
    folio: "Colophon",
    category: "PHILOSOPHY",
  },
];

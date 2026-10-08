export type BookState = "closed" | "opening" | "open" | "flipping" | "unveiled";

export interface BookChapter {
  id: string;
  roman: string;
  title: string;
  subtitle: string;
  actionType: "link" | "unveil" | "modal";
  href?: string;
  modalTarget?: "authors" | "colophon";
  folio: string;
  category: string;
}

export const BOOK_CHAPTERS: BookChapter[] = [
  {
    id: "read",
    roman: "I",
    title: "The Lead Monograph",
    subtitle: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
    actionType: "link",
    href: "/read/crafting-systems-that-endure",
    folio: "pp. 14–28",
    category: "LITERARY MONOGRAPH",
  },
  {
    id: "discover",
    roman: "II",
    title: "Gazetteer & Anthology",
    subtitle: "Explore the live editorial dispatches, curated volumes, and almanac",
    actionType: "unveil",
    folio: "pp. 29–64",
    category: "CONTINUOUS PRESS",
  },
  {
    id: "write",
    roman: "III",
    title: "Scribe Studio Desk",
    subtitle: "Local-first composition sanctuary with rich typographic blocks",
    actionType: "link",
    href: "/write",
    folio: "pp. 65–88",
    category: "AUTHOR SANCTUARY",
  },
  {
    id: "ledger",
    roman: "IV",
    title: "Editorial Ledger",
    subtitle: "The complete publication catalog, filterable by genre and tone",
    actionType: "link",
    href: "/posts",
    folio: "pp. 89–110",
    category: "COLLECTIONS CATALOG",
  },
  {
    id: "authors",
    roman: "V",
    title: "Resident Authors & Fellows",
    subtitle: "The thinkers, essayists, and architects contributing to Volume IV",
    actionType: "modal",
    modalTarget: "authors",
    folio: "pp. 111–124",
    category: "COLLEGIUM",
  },
  {
    id: "colophon",
    roman: "VI",
    title: "Colophon & Manifesto",
    subtitle: "Principles of the living digital book, typographic rules, and edition notes",
    actionType: "modal",
    modalTarget: "colophon",
    folio: "pp. 125–130",
    category: "EDITORIAL PREFACE",
  },
];

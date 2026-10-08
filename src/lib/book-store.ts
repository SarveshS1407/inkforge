import { BookIdentity, CoverVersion } from "@/types/book";

const STORAGE_KEY = "inkforge_books";
const ACTIVE_BOOK_KEY = "inkforge_active_book_id";

export const SEED_BOOKS: BookIdentity[] = [
  {
    id: "book-systems-endure",
    slug: "crafting-systems-that-endure",
    title: "Crafting Systems That Endure",
    subtitle: "The Philosophy of Long-Horizon Software",
    author: "Elena Rostova",
    description:
      "A foundational treatise examining permanence, architectural discipline, and treating digital constructs with the gravity of literature.",
    genre: "Systems & Architecture",
    mood: "Contemplative & Enduring",
    keywords: ["Architecture", "Endurance", "Calculus", "Software"],
    visualThemes: ["Structural Logic", "Architectural Permanence"],
    tone: "Scholarly, authoritative, quiet",
    coverDirection: "editorial",
    cover: {
      currentVersionId: "cov-seed-1",
      versions: [
        {
          id: "cov-seed-1",
          versionNumber: 1,
          directionId: "editorial",
          palette: {
            clothColor: "#171513",
            accentColor: "#d8a14b",
            foilColor: "#dfb76c",
            paperTone: "cotton",
            textColor: "#fbf9f4",
          },
          typography: {
            titleFont: "serif",
            style: "debossed-gold",
          },
          artworkSource: "curated",
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ],
    },
    chapters: [
      { id: "ch-1", title: "The Ephemeral Bias", order: 1, wordCount: 1840, status: "FINAL" },
      { id: "ch-2", title: "Foundations in Stone", order: 2, wordCount: 2210, status: "FINAL" },
      { id: "ch-3", title: "The Scribe's Sanctuary", order: 3, wordCount: 1420, status: "REVISED" },
    ],
    notesCount: 7,
    state: "PUBLISHED",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "book-sovereign-writer",
    slug: "the-sovereign-writer",
    title: "The Sovereign Writer",
    subtitle: "Essays on Independence, Personal Archives, and Literary Autonomy",
    author: "Marcus Chen",
    description:
      "Why creators are departing algorithmic silos and returning to self-hosted digital gardens, bespoke publishing houses, and sovereign distribution.",
    genre: "Literary Ecology",
    mood: "Provocative & Hopeful",
    keywords: ["Digital Ecology", "Independence", "Autonomy", "Essays"],
    visualThemes: ["Human Solitude", "Atmospheric Memory"],
    tone: "Urgent, reflective, literary",
    coverDirection: "cinematic",
    cover: {
      currentVersionId: "cov-seed-2",
      versions: [
        {
          id: "cov-seed-2",
          versionNumber: 1,
          directionId: "cinematic",
          palette: {
            clothColor: "#1a2231",
            accentColor: "#99292d",
            foilColor: "#f6e3a1",
            paperTone: "vellum",
            textColor: "#f4eee2",
          },
          typography: {
            titleFont: "serif",
            style: "debossed-gold",
          },
          artworkSource: "curated",
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ],
    },
    chapters: [
      { id: "ch-1", title: "The Decaying Feed", order: 1, wordCount: 1650, status: "FINAL" },
      { id: "ch-2", title: "The Quiet Sanctuary", order: 2, wordCount: 1980, status: "DRAFT" },
    ],
    notesCount: 4,
    state: "IN_PROGRESS",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export function getStoredBooks(): BookIdentity[] {
  if (typeof window === "undefined") return SEED_BOOKS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_BOOKS));
      return SEED_BOOKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_BOOKS;
  } catch (e) {
    console.error("Failed to parse stored books", e);
    return SEED_BOOKS;
  }
}

export function saveBook(book: BookIdentity): void {
  if (typeof window === "undefined") return;

  try {
    const books = getStoredBooks();
    const index = books.findIndex((b) => b.id === book.id);
    if (index >= 0) {
      books[index] = { ...book, updatedAt: new Date().toISOString() };
    } else {
      books.unshift({ ...book, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    localStorage.setItem(ACTIVE_BOOK_KEY, book.id);
  } catch (e) {
    console.error("Failed to save book", e);
  }
}

export function getBookById(id: string): BookIdentity | null {
  const books = getStoredBooks();
  return books.find((b) => b.id === id || b.slug === id) || null;
}

export function getActiveBook(): BookIdentity | null {
  if (typeof window === "undefined") return SEED_BOOKS[0];
  const activeId = localStorage.getItem(ACTIVE_BOOK_KEY);
  if (activeId) {
    const found = getBookById(activeId);
    if (found) return found;
  }
  const books = getStoredBooks();
  return books[0] || null;
}

export function addCoverVersion(bookId: string, version: CoverVersion): BookIdentity | null {
  const book = getBookById(bookId);
  if (!book) return null;

  const versions = [...book.cover.versions, version];
  const updatedBook: BookIdentity = {
    ...book,
    cover: {
      currentVersionId: version.id,
      versions,
    },
    updatedAt: new Date().toISOString(),
  };

  saveBook(updatedBook);
  return updatedBook;
}

export function setActiveCoverVersion(bookId: string, versionId: string): BookIdentity | null {
  const book = getBookById(bookId);
  if (!book) return null;

  const exists = book.cover.versions.some((v) => v.id === versionId);
  if (!exists) return book;

  const updatedBook: BookIdentity = {
    ...book,
    cover: {
      ...book.cover,
      currentVersionId: versionId,
    },
    updatedAt: new Date().toISOString(),
  };

  saveBook(updatedBook);
  return updatedBook;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  BookOpen,
  Compass,
  PenTool,
  HelpCircle,
  Search,
  ArrowRight,
  ChevronDown,
  Layers,
  Users,
  Feather,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "getting-started" | "reading" | "writing" | "account";
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: "getting-started",
    question: "What is INKFORGE?",
    answer:
      "INKFORGE is a digital publishing platform and reading space inspired by the craft of physical bookmaking and the agility of modern software. It is a home to write, publish, discover, and read thoughtful essays, treatises, and stories.",
  },
  {
    category: "getting-started",
    question: "Where should I start as a new visitor?",
    answer:
      "If you want to read, click 'Read' to dive into our flagship essay, or 'Discover' to browse by topic. If you have something to write, click 'Write' to enter our distraction-free Scribe Studio.",
  },
  {
    category: "getting-started",
    question: "Why does INKFORGE feature a book on the homepage?",
    answer:
      "The 3D book is our visual signature and emotional centerpiece. It represents permanence, craft, and literary care. It serves as an inviting visual entrance to the platform without complicating direct navigation.",
  },
  {
    category: "reading",
    question: "How do I find something to read?",
    answer:
      "Click 'Discover' to browse essays filtered by topics such as Systems Craft, Literary Ecology, and Digital Theory. You can also visit 'Collections' to explore thematic reading folios.",
  },
  {
    category: "reading",
    question: "How does the reading experience work?",
    answer:
      "The reader is formatted with generous typography in Charter serif, margins for author notes, a live reading progress bar, estimated reading time, and custom paper tones (Cotton Ivory, Bookshop Vellum, and Midnight Buckram).",
  },
  {
    category: "reading",
    question: "Can I save or bookmark an article for later?",
    answer:
      "Yes. Every reading page includes a bookmark action in the margin header. Bookmarks are saved directly to your local browser storage so you can resume anytime.",
  },
  {
    category: "writing",
    question: "How do I create and draft an essay?",
    answer:
      "Click 'Write' from anywhere in INKFORGE to enter the Scribe Studio. Type your title, excerpt, and body text. The studio features rich block composition, word counting, and an editorial proofreading mode.",
  },
  {
    category: "writing",
    question: "Will I lose my draft if I close the tab?",
    answer:
      "No. INKFORGE features local-first automatic saving. Every keystroke is saved immediately to your browser's persistent storage, ensuring you never lose a syllable.",
  },
  {
    category: "writing",
    question: "How does publishing work?",
    answer:
      "When your draft is complete, click 'Publish Now' or 'Schedule' in the studio toolbar. Published pieces immediately appear in the Discover catalog and author ledger.",
  },
  {
    category: "account",
    question: "Do I need an account to write on INKFORGE?",
    answer:
      "You can begin writing immediately as a guest. All drafts and preferences save to your local device. Signing in allows you to tie your author identity to a permanent profile.",
  },
  {
    category: "account",
    question: "How do the paper tone options work?",
    answer:
      "The Paper selector in the top navigation toggles between Cotton (crisp off-white), Vellum (warm bookshop amber), and Buckram (dark mode inspired by library bindings). Your chosen tone persists across all pages.",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const toggleItem = (idx: number) => {
    setOpenItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const filteredItems = FAQ_ITEMS.filter((item) => {
    const matchesCategory =
      activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Progressive GPU-accelerated scroll reveals
  useScrollReveal([filteredItems]);

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center space-x-2 font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
          <Link href="/" className="hover:text-[var(--oxblood)] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[var(--oxblood)] font-bold">Help &amp; Guide</span>
        </div>

        {/* Masthead */}
        <section className="scroll-ink-reveal border-b border-[var(--editorial-rule)] pb-8 mb-10">
          <div className="inline-flex items-center space-x-2 font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] mb-2 font-bold">
            <HelpCircle className="h-4 w-4" />
            <span>Support &amp; Guidance</span>
          </div>
          <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink-primary)]">
            How INKFORGE Works
          </h1>
          <p className="font-editorial-serif text-base sm:text-lg text-[var(--ink-secondary)] italic mt-2 max-w-2xl">
            Clear answers to common questions about reading, discovering, writing, and navigating the platform.
          </p>

          {/* Quick Action Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Link
              href="/read/crafting-systems-that-endure"
              className="group rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-5 transition-all hover:border-[var(--oxblood)] hover:shadow-md"
            >
              <div className="flex items-center justify-between font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold mb-2">
                <span className="flex items-center space-x-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Read</span>
                </span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="font-editorial-sans text-xs text-[var(--ink-secondary)] leading-relaxed">
                Explore longform essays, margins, and our flagship monograph.
              </p>
            </Link>

            <Link
              href="/discover"
              className="group rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-5 transition-all hover:border-[var(--oxblood)] hover:shadow-md"
            >
              <div className="flex items-center justify-between font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold mb-2">
                <span className="flex items-center space-x-1.5">
                  <Compass className="h-3.5 w-3.5" />
                  <span>Discover</span>
                </span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="font-editorial-sans text-xs text-[var(--ink-secondary)] leading-relaxed">
                Browse writings gathered across topics, collections, and authors.
              </p>
            </Link>

            <Link
              href="/write"
              className="group rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-5 transition-all hover:border-[var(--oxblood)] hover:shadow-md"
            >
              <div className="flex items-center justify-between font-editorial-mono text-xs uppercase tracking-wider text-[var(--oxblood)] font-bold mb-2">
                <span className="flex items-center space-x-1.5">
                  <PenTool className="h-3.5 w-3.5" />
                  <span>Write</span>
                </span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="font-editorial-sans text-xs text-[var(--ink-secondary)] leading-relaxed">
                Open Scribe Studio to draft, edit, and publish your own work.
              </p>
            </Link>
          </div>
        </section>

        {/* Search & Category Filter */}
        <section className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--ink-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for answers (e.g., autosave, publish, bookmark, paper)..."
              className="w-full rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] pl-10 pr-4 py-2.5 font-editorial-sans text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/60 focus:border-[var(--oxblood)] focus:outline-none shadow-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2 font-editorial-mono text-xs uppercase tracking-wider">
            {[
              { id: "all", label: "All Questions" },
              { id: "getting-started", label: "Getting Started" },
              { id: "reading", label: "Reading & Collections" },
              { id: "writing", label: "Writing & Publishing" },
              { id: "account", label: "Account & Materials" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md border transition-colors ${
                  activeCategory === cat.id
                    ? "bg-[var(--oxblood)] text-white border-[var(--oxblood)] font-bold"
                    : "bg-[var(--paper-surface)] text-[var(--ink-secondary)] border-[var(--paper-border)] hover:border-[var(--oxblood)]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* FAQ Accordion List */}
        <section className="space-y-3 mb-12">
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-8 text-center space-y-2">
              <p className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
                No matching answers found
              </p>
              <p className="font-editorial-sans text-xs text-[var(--ink-muted)]">
                Try searching for different terms or reset the category filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-3 font-editorial-mono text-xs text-[var(--oxblood)] underline"
              >
                Reset Search
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isOpen = openItems[idx] ?? false;

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] overflow-hidden shadow-xs transition-colors hover:border-[var(--oxblood)]/50"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-5 text-left font-editorial-serif text-base sm:text-lg font-bold text-[var(--ink-primary)] hover:text-[var(--oxblood)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oxblood)]"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[var(--ink-muted)] transition-transform duration-200 ml-4 ${
                        isOpen ? "rotate-180 text-[var(--oxblood)]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 font-editorial-sans text-sm text-[var(--ink-secondary)] leading-relaxed border-t border-[var(--editorial-rule)]/50 mt-1">
                      <p className="pt-3">{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* Still Need Assistance Banner */}
        <section className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-6 sm:p-8 space-y-3 text-center">
          <span className="font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)] font-bold">
            Still Have Questions?
          </span>
          <h2 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
            We are here to support your craft.
          </h2>
          <p className="font-editorial-sans text-xs sm:text-sm text-[var(--ink-secondary)] max-w-lg mx-auto leading-relaxed">
            Whether you are reporting a typographical question or seeking feedback on your manuscript, reach out to the editorial desk.
          </p>
          <div className="pt-2 flex justify-center space-x-4">
            <Link
              href="/about"
              className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-2 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors"
            >
              <span>Read About INKFORGE</span>
            </Link>
            <Link
              href="/write"
              className="inline-flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-4 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] transition-colors"
            >
              <span>Open Scribe Studio</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import {
  Feather,
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  CheckCircle2,
} from "lucide-react";

const FEATURED_STORIES = [
  {
    slug: "crafting-systems-that-endure",
    title: "Crafting Systems That Endure: The Philosophy of Long-Horizon Software",
    excerpt:
      "Modern engineering often rushes to ship ephemeral features. But the truest software architecture mirrors literature: thoughtful, disciplined, and designed for decades.",
    author: "Elena Rostova",
    role: "Lead Systems Architect",
    date: "Oct 6, 2026",
    readingTime: "6 min read",
    publication: "Architecture & Craft",
    status: "PUBLISHED",
  },
  {
    slug: "the-death-and-rebirth-of-the-independent-web",
    title: "The Rebirth of the Independent Web: Why Writers Are Leaving Algorithmic Silos",
    excerpt:
      "Feeds incentivize outrage and decay attention. A new renaissance of dedicated publications, newsletters, and bespoke digital spaces is quietly reclaiming the written word.",
    author: "Marcus Chen",
    role: "Editorial Essayist",
    date: "Oct 5, 2026",
    readingTime: "4 min read",
    publication: "Digital Ecology",
    status: "PUBLISHED",
  },
  {
    slug: "block-based-composition-in-modern-publishing",
    title: "The Architecture of Block Composition: From ProseMirror ASTs to Dynamic Canvases",
    excerpt:
      "How decoupling content blocks from rigid HTML structures unlocks programmable narratives, responsive media embeds, and effortless multi-format syndication.",
    author: "David Vance",
    role: "Principal Frontend Engineer",
    date: "Oct 3, 2026",
    readingTime: "8 min read",
    publication: "Inkforge Engineering",
    status: "PUBLISHED",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#f1f2f4]">
      <Header />

      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 bg-gradient-to-b from-amber-500/[0.04] via-transparent to-transparent py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Generation Publishing Infrastructure</span>
          </div>

          <h1 className="font-serif text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl leading-[1.1]">
            Where Great Writing <br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              Becomes Literature.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
            Inkforge is a precision-engineered publishing ecosystem designed for writers, editorial collectives, and publication networks.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/write"
              className="flex items-center space-x-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-amber-400 hover:shadow-xl hover:shadow-amber-500/25 active:scale-95"
            >
              <span>Launch Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/posts"
              className="flex items-center space-x-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            >
              <Layers className="h-4 w-4" />
              <span>Explore Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Feed */}
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="mb-10 flex items-end justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Curated Stories
            </span>
            <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">
              From the Collective
            </h2>
          </div>
          <Link
            href="/posts"
            className="text-xs font-medium text-zinc-400 hover:text-amber-400 transition-colors"
          >
            View all stories &rarr;
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {FEATURED_STORIES.map((story) => (
            <article
              key={story.slug}
              className="group flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/60"
            >
              <div>
                <div className="mb-3 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium text-amber-400/90">{story.publication}</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{story.readingTime}</span>
                  </span>
                </div>

                <Link href={`/read/${story.slug}`}>
                  <h3 className="font-serif text-xl font-bold leading-snug text-white transition-colors group-hover:text-amber-300">
                    {story.title}
                  </h3>
                </Link>

                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                  {story.excerpt}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-zinc-800/60 pt-4 text-xs text-zinc-500">
                <div>
                  <p className="font-medium text-zinc-300">{story.author}</p>
                  <p className="text-[11px] text-zinc-500">{story.role}</p>
                </div>
                <span>{story.date}</span>
              </div>
            </article>
          ))}
        </div>

        {/* Platform Architecture Highlights */}
        <div className="mt-20 rounded-3xl border border-zinc-800 bg-zinc-950 p-8 sm:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">
              Engineered for the Full Publishing Lifecycle
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Inkforge marries a lightweight, distraction-free writing studio with an enterprise-scale editorial workflow engine.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Feather className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">Block Editor</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                Extensible ProseMirror/Tiptap AST supporting custom blocks, callouts, and slash shortcuts.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Calendar className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">Scheduled Releases</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                Programmatic and queue-based publishing for time-sensitive editions and newsletters.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">Publications (RBAC)</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                Multi-author organizations with Owner, Editor, Author, and Contributor permissions.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">Prisma Data Layer</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                Strict relational integrity, full revision histories, and seamless Postgres migration.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#08090a] py-8 text-center text-xs text-zinc-500">
        <p>Inkforge Publishing Platform • Precision-crafted for modern authors.</p>
      </footer>
    </div>
  );
}

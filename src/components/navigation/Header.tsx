"use client";

import Link from "next/link";
import { PenTool, Feather, BookOpen, Layers } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#0c0d0e]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-md shadow-amber-950/20 transition-transform group-hover:scale-105">
              <Feather className="h-5 w-5 fill-black" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-white">
              INK<span className="text-amber-500">FORGE</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium text-zinc-400">
            <Link
              href="/"
              className="flex items-center space-x-1.5 rounded-md px-3 py-1.5 transition-colors hover:text-zinc-100 hover:bg-zinc-800/40"
            >
              <BookOpen className="h-4 w-4" />
              <span>Explore</span>
            </Link>
            <Link
              href="/posts"
              className="flex items-center space-x-1.5 rounded-md px-3 py-1.5 transition-colors hover:text-zinc-100 hover:bg-zinc-800/40"
            >
              <Layers className="h-4 w-4" />
              <span>Studio Dashboard</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/write"
            className="flex items-center space-x-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
          >
            <PenTool className="h-4 w-4" />
            <span>Write Story</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

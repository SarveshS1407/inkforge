"use client";

import { Header } from "@/components/navigation/Header";
import { BookCreationWizard } from "@/components/books/BookCreationWizard";

export default function CreateBookPage() {
  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />
      <main>
        <BookCreationWizard />
      </main>
    </div>
  );
}

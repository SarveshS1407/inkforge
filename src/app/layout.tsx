import type { Metadata } from "next";
import { EditionProvider } from "@/components/theme/EditionContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inkforge — The Living Digital Book & Publishing Platform",
  description:
    "A living publishing ecosystem combining editorial sophistication, tactile book-inspired design, and modern digital energy. Crafted for discerning writers and readers.",
  keywords: ["publishing", "literary journal", "essays", "writer studio", "book design", "reading", "typography"],
  authors: [{ name: "The Inkforge Editors" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)] antialiased selection:bg-[var(--oxblood)] selection:text-white">
        <EditionProvider>{children}</EditionProvider>
      </body>
    </html>
  );
}

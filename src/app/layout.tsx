import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inkforge — The Modern Publishing Platform",
  description:
    "An artisanal publishing ecosystem crafted for writers and readers. Distraction-free writing, collaborative publications, and high-performance reader architecture.",
  keywords: ["publishing", "blog engine", "writer studio", "editorial", "journalism", "newsletter"],
  authors: [{ name: "Inkforge Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0c0d0e] text-[#f1f2f4] antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}

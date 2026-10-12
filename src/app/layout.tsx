import type { Metadata, Viewport } from "next";
import { EditionProvider } from "@/components/theme/EditionContext";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1012" },
    { media: "(prefers-color-scheme: light)", color: "#fbf9f4" },
  ],
};

export const metadata: Metadata = {
  title: "Inkforge — The Living Digital Book & Publishing Platform",
  description:
    "A living publishing ecosystem combining editorial sophistication, tactile book-inspired design, and modern digital energy. Crafted for discerning writers and readers.",
  keywords: ["publishing", "literary journal", "essays", "writer studio", "book design", "reading", "typography"],
  authors: [{ name: "The Inkforge Editors" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inkforge",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('inkforge_paper_tone');var r=document.documentElement;r.classList.remove('tone-cotton','tone-vellum','tone-inkwell','dark');if(t==='inkwell'){r.classList.add('dark','tone-inkwell');}else if(t==='vellum'){r.classList.add('tone-vellum');}else{r.classList.add('tone-cotton');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)] antialiased selection:bg-[var(--oxblood)] selection:text-white">
        <EditionProvider>{children}</EditionProvider>
      </body>
    </html>
  );
}

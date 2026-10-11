"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type PaperTone = "cotton" | "vellum" | "inkwell";

export interface ThemeOption {
  id: PaperTone;
  name: string;
  shortLabel: string;
  description: string;
  swatchBg: string;
  swatchBorder: string;
  inkPreview: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "cotton",
    name: "Cotton Ivory",
    shortLabel: "Cotton",
    description: "Natural warm ivory newsprint",
    swatchBg: "#fbf9f4",
    swatchBorder: "#e4dccb",
    inkPreview: "#1d1917",
  },
  {
    id: "vellum",
    name: "Bookshop Vellum",
    shortLabel: "Vellum",
    description: "Warm amber antiquarian paper",
    swatchBg: "#f4eee2",
    swatchBorder: "#d7c7ab",
    inkPreview: "#221914",
  },
  {
    id: "inkwell",
    name: "Midnight Buckram",
    shortLabel: "Buckram",
    description: "Library night cloth (Dark)",
    swatchBg: "#16171b",
    swatchBorder: "#2a2d35",
    inkPreview: "#ede8df",
  },
];

interface EditionContextType {
  tone: PaperTone;
  setTone: (tone: PaperTone) => void;
  cycleTone: () => void;
}

const EditionContext = createContext<EditionContextType>({
  tone: "cotton",
  setTone: () => {},
  cycleTone: () => {},
});

export function EditionProvider({ children }: { children: React.ReactNode }) {
  const [tone, setToneState] = useState<PaperTone>("cotton");

  useEffect(() => {
    const saved = localStorage.getItem("inkforge_paper_tone") as PaperTone | null;
    if (saved && (saved === "cotton" || saved === "vellum" || saved === "inkwell")) {
      applyTone(saved);
    } else {
      applyTone("cotton");
    }
  }, []);

  const applyTone = (newTone: PaperTone) => {
    setToneState(newTone);
    localStorage.setItem("inkforge_paper_tone", newTone);

    const root = document.documentElement;
    root.classList.remove("tone-cotton", "tone-vellum", "tone-inkwell", "dark");

    if (newTone === "inkwell") {
      root.classList.add("dark", "tone-inkwell");
    } else if (newTone === "vellum") {
      root.classList.add("tone-vellum");
    } else {
      root.classList.add("tone-cotton");
    }
  };

  const cycleTone = () => {
    const nextMap: Record<PaperTone, PaperTone> = {
      cotton: "vellum",
      vellum: "inkwell",
      inkwell: "cotton",
    };
    applyTone(nextMap[tone]);
  };

  return (
    <EditionContext.Provider value={{ tone, setTone: applyTone, cycleTone }}>
      {children}
    </EditionContext.Provider>
  );
}

export function useEdition() {
  return useContext(EditionContext);
}

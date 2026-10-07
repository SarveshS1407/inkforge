"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type PaperTone = "cotton" | "vellum" | "inkwell";

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

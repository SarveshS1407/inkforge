"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type EditionMode = "paper" | "inkwell";

interface EditionContextType {
  mode: EditionMode;
  toggleMode: () => void;
  setMode: (mode: EditionMode) => void;
}

const EditionContext = createContext<EditionContextType>({
  mode: "paper",
  toggleMode: () => {},
  setMode: () => {},
});

export function EditionProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<EditionMode>("paper");

  useEffect(() => {
    const saved = localStorage.getItem("inkforge_edition_mode") as EditionMode | null;
    if (saved === "inkwell" || saved === "paper") {
      setModeState(saved);
      if (saved === "inkwell") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const setMode = (newMode: EditionMode) => {
    setModeState(newMode);
    localStorage.setItem("inkforge_edition_mode", newMode);
    if (newMode === "inkwell") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleMode = () => {
    setMode(mode === "paper" ? "inkwell" : "paper");
  };

  return (
    <EditionContext.Provider value={{ mode, toggleMode, setMode }}>
      {children}
    </EditionContext.Provider>
  );
}

export function useEdition() {
  return useContext(EditionContext);
}

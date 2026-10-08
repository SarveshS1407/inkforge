"use client";

import { ReactNode } from "react";
import { BookState } from "./types";

interface BookShellProps {
  state: BookState;
  children: ReactNode;
}

export function BookShell({ state, children }: BookShellProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center px-4 py-8 sm:py-12 md:py-16">
      {/* Editorial Stage / Desk Lighting Ambient Halo */}
      <div className="relative w-full max-w-5xl flex items-center justify-center">
        {/* Soft Ambient Light Glow beneath the volume */}
        <div className="absolute -inset-4 sm:-inset-8 rounded-3xl bg-[var(--paper-warm)]/40 blur-2xl pointer-events-none -z-10" />

        {/* 3D Perspective Stage Container */}
        <div
          className={`w-full perspective-book transition-all duration-700 ease-out ${
            state === "opening" ? "scale-[0.98]" : "scale-100"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

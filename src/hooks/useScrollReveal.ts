"use client";

import { useEffect } from "react";

/**
 * Custom React hook for performant, GPU-accelerated scroll reveals across INKFORGE.
 * Observes elements with:
 * - .editorial-reveal (smooth vertical rise)
 * - .scroll-pop-reveal (scale pop-in with elastic spring settle)
 * - .scroll-emerge-left / .scroll-emerge-right (lateral masked emergence)
 * - .scroll-ink-reveal (classical clip-path ink wash reveal)
 * - .scroll-stagger-child (cascading entrance)
 * 
 * Automatically respects `prefers-reduced-motion: reduce`.
 */
export function useScrollReveal(dependencies: any[] = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SELECTORS = [
      ".editorial-reveal",
      ".scroll-pop-reveal",
      ".scroll-emerge-left",
      ".scroll-emerge-right",
      ".scroll-ink-reveal",
      ".scroll-stagger-child",
    ].join(", ");

    // Instantly reveal all elements if the user prefers reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(SELECTORS).forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    const elements = document.querySelectorAll(SELECTORS);
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies); // Re-run when dependencies (e.g. data arrays) change
}

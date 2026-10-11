"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEdition, THEME_OPTIONS, PaperTone } from "./EditionContext";
import { Palette, ChevronDown, Check } from "lucide-react";

interface ThemeSelectorProps {
  variant?: "header" | "mobile-drawer";
  className?: string;
}

export function ThemeSelector({
  variant = "header",
  className = "",
}: ThemeSelectorProps) {
  const { tone, setTone } = useEdition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentTheme =
    THEME_OPTIONS.find((t) => t.id === tone) || THEME_OPTIONS[0];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard events (Escape, Arrow Up/Down)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      if (event.key === "Escape") {
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = useCallback(
    (themeId: PaperTone) => {
      setTone(themeId);
      setIsOpen(false);
      triggerButtonRef.current?.focus();
    },
    [setTone]
  );

  const handleMenuKeyDown = (
    e: React.KeyboardEvent,
    index: number
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % THEME_OPTIONS.length;
      itemRefs.current[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex =
        (index - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length;
      itemRefs.current[prevIndex]?.focus();
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  // MOBILE DRAWER ACCORDION / EXPANDED DROPDOWN VARIANT
  if (variant === "mobile-drawer") {
    return (
      <div className={`space-y-2 ${className}`} ref={containerRef}>
        <div className="flex items-center justify-between">
          <span className="font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--ink-muted)] font-bold">
            Reading Theme
          </span>
          <span className="font-editorial-mono text-[9px] uppercase text-[var(--oxblood)] font-medium">
            {currentTheme.name}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5" role="radiogroup" aria-label="Reading theme options">
          {THEME_OPTIONS.map((t) => {
            const isSelected = tone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setTone(t.id)}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-lg border transition-all text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] ${
                  isSelected
                    ? "bg-[var(--paper-warm)] border-[var(--oxblood)] text-[var(--ink-primary)] shadow-xs"
                    : "border-[var(--paper-border)] bg-[var(--paper-canvas)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--paper-border-strong)]"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="h-5 w-5 rounded-full border shadow-2xs shrink-0 flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: t.swatchBg,
                      borderColor: t.swatchBorder,
                    }}
                    aria-hidden="true"
                  >
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: t.inkPreview }}
                    />
                  </div>
                  <div>
                    <div className="font-editorial-sans text-xs font-semibold">
                      {t.name}
                    </div>
                    <div className="font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                      {t.description}
                    </div>
                  </div>
                </div>

                <div className="w-5 h-5 flex items-center justify-center">
                  {isSelected && (
                    <Check
                      className="h-4 w-4 text-[var(--oxblood)]"
                      strokeWidth={2.5}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // DESKTOP & HEADER COMPACT DROPDOWN
  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Trigger Button: Uniform 32px height (h-8) */}
      <button
        ref={triggerButtonRef}
        type="button"
        id="theme-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="theme-menu-dropdown"
        aria-label={`Theme selector, currently ${currentTheme.name}`}
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 flex items-center space-x-1.5 sm:space-x-2 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 sm:px-3 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-all shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)]"
      >
        <Palette className="h-3.5 w-3.5 text-[var(--ink-muted)] group-hover:text-[var(--oxblood)]" />
        <span className="hidden sm:inline font-medium">Theme</span>

        {/* Live Swatch Preview Dot */}
        <span
          className="inline-block h-2.5 w-2.5 rounded-full border shadow-2xs transition-colors"
          style={{
            backgroundColor: currentTheme.swatchBg,
            borderColor: currentTheme.swatchBorder,
          }}
          aria-hidden="true"
        />

        <ChevronDown
          className={`h-3 w-3 text-[var(--ink-muted)] opacity-70 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Anchored Dropdown Menu */}
      {isOpen && (
        <div
          id="theme-menu-dropdown"
          role="menu"
          aria-labelledby="theme-menu-trigger"
          className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-xl animate-in fade-in slide-in-from-top-1 overflow-hidden"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-[var(--editorial-rule)] bg-[var(--paper-warm)]/50 flex items-center justify-between">
            <span className="font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
              Color Theme
            </span>
            <span className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
              {currentTheme.shortLabel} active
            </span>
          </div>

          {/* Theme Options */}
          <div className="p-1 space-y-0.5" role="none">
            {THEME_OPTIONS.map((t, index) => {
              const isSelected = tone === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  tabIndex={isOpen ? 0 : -1}
                  onClick={() => handleSelect(t.id)}
                  onKeyDown={(e) => handleMenuKeyDown(e, index)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors focus-visible:outline-hidden focus-visible:bg-[var(--paper-warm)] ${
                    isSelected
                      ? "bg-[var(--paper-warm)] text-[var(--ink-primary)]"
                      : "text-[var(--ink-secondary)] hover:bg-[var(--paper-warm)]/60 hover:text-[var(--ink-primary)]"
                  }`}
                >
                  {/* Color preview card */}
                  <div
                    className="relative h-6 w-6 rounded-md border flex items-center justify-center shadow-2xs shrink-0 overflow-hidden"
                    style={{
                      backgroundColor: t.swatchBg,
                      borderColor: t.swatchBorder,
                    }}
                    aria-hidden="true"
                  >
                    <div
                      className="h-2 w-2 rounded-full shadow-2xs"
                      style={{ backgroundColor: t.inkPreview }}
                    />
                  </div>

                  {/* Name and Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`font-editorial-sans text-xs tracking-wide ${
                          isSelected
                            ? "font-bold text-[var(--ink-primary)]"
                            : "font-medium"
                        }`}
                      >
                        {t.name}
                      </span>
                    </div>
                    <p className="font-editorial-mono text-[10px] text-[var(--ink-muted)] truncate">
                      {t.description}
                    </p>
                  </div>

                  {/* Selected checkmark */}
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {isSelected && (
                      <Check
                        className="h-3.5 w-3.5 text-[var(--oxblood)]"
                        strokeWidth={2.5}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BookChapter,
  BOOK_CHAPTERS,
} from "./types";
import {
  ArrowRight,
  BookOpen,
  Compass,
  PenTool,
  Layers,
  Users,
  BookMarked,
  X,
  RotateCcw,
} from "lucide-react";

import { BookIdentity, CoverVersion } from "@/types/book";

interface PhysicalBookProps {
  isOpen: boolean;
  isOpening?: boolean;
  skipInitialAnimation?: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelectChapter?: (chapter: BookChapter) => void;
  onUnveilFullApp?: () => void;
  book?: BookIdentity | null;
  activeVersion?: CoverVersion | null;
  onMenuAction?: (actionKey: string) => void;
}

export function PhysicalBook({
  isOpen,
  isOpening = false,
  skipInitialAnimation = false,
  onOpen,
  onClose,
  onSelectChapter,
  onUnveilFullApp,
  book = null,
  activeVersion = null,
  onMenuAction,
}: PhysicalBookProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileFolio, setMobileFolio] = useState<"contents" | "colophon">("contents");
  const [allowTransition, setAllowTransition] = useState<boolean>(!skipInitialAnimation);

  // Dimensions of a single page/board
  const PAGE_WIDTH = 430;
  const PAGE_HEIGHT = 600;

  // Manage transition suppression on state restoration
  useEffect(() => {
    if (skipInitialAnimation) {
      setAllowTransition(false);
      const timer = setTimeout(() => {
        setAllowTransition(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setAllowTransition(true);
    }
  }, [skipInitialAnimation]);

  // Default to the interactive Table of Contents on open
  useEffect(() => {
    if (isOpen) {
      setMobileFolio("contents");
    }
  }, [isOpen]);

  const activeCover = activeVersion || (book ? book.cover.versions.find((v) => v.id === book.cover.currentVersionId) || book.cover.versions[0] : null);

  const getAdaptiveMenuItems = (state: string) => {
    switch (state) {
      case "NEW":
        return [
          { key: "write", title: "Begin Writing", subtitle: "Enter the Scribe Studio composition desk", icon: PenTool, roman: "I" },
          { key: "outline", title: "Outline & Structure", subtitle: "Map out planned chapters and milestones", icon: Layers, roman: "II" },
          { key: "notes", title: "Story Bible & Notes", subtitle: "Archive character sketches, research, and worldbuilding", icon: BookMarked, roman: "III" },
          { key: "cover", title: "Cover & Visual Identity", subtitle: "Refine cover artwork, typography, and palette", icon: Compass, roman: "IV" },
        ];
      case "READY_TO_PUBLISH":
        return [
          { key: "write", title: "Final Polish", subtitle: "Proofread and review manuscript", icon: PenTool, roman: "I" },
          { key: "preview", title: "Reader Preview", subtitle: "Simulate reading experience across devices", icon: BookOpen, roman: "II" },
          { key: "metadata", title: "Colophon & Metadata", subtitle: "Configure archival imprint, ISBN, and tags", icon: BookMarked, roman: "III" },
          { key: "publish", title: "Inscribe & Publish", subtitle: "Commit to public catalog and syndication", icon: ArrowRight, roman: "IV" },
        ];
      case "PUBLISHED":
        return [
          { key: "read", title: "Read Monograph", subtitle: "Open bound edition in Reader mode", icon: BookOpen, roman: "I" },
          { key: "write", title: "Edit Manuscript", subtitle: "Inscribe amendments and new editions", icon: PenTool, roman: "II" },
          { key: "analytics", title: "Reader Ledger", subtitle: "Review reader retention and distribution", icon: Layers, roman: "III" },
          { key: "cover", title: "Cover Archive", subtitle: "Inspect past cover versions and plates", icon: Compass, roman: "IV" },
        ];
      case "IN_PROGRESS":
      default:
        return [
          { key: "write", title: "Continue Writing", subtitle: "Inscribe next chapter in Scribe Studio", icon: PenTool, roman: "I" },
          { key: "chapters", title: "Chapter Folios", subtitle: "Manage active chapters and word count", icon: Layers, roman: "II" },
          { key: "notes", title: "Research & Marginalia", subtitle: "Reference story notes and sources", icon: BookMarked, roman: "III" },
          { key: "cover", title: "Cover & Palette", subtitle: "Refine active cover direction and typography", icon: Compass, roman: "IV" },
          { key: "preview", title: "Reader Proof", subtitle: "Preview layout in reader typography", icon: BookOpen, roman: "V" },
        ];
    }
  };

  // Responsive scale calculator: mobile scales single page for maximum readability & tap comfort
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        const vw = window.innerWidth;
        const mobile = vw < 768;
        setIsMobile(mobile);
        if (mobile) {
          // Mobile single-page scaling (430px base width) with comfortable horizontal margins
          const padding = vw < 380 ? 24 : 32;
          const targetScale = Math.min(0.94, Math.max(0.68, (vw - padding) / PAGE_WIDTH));
          setScale(targetScale);
        } else if (vw < 1024) {
          // Tablet view: 2-page spread scaled to fit comfortably
          setScale(Math.min(0.95, Math.max(0.72, (vw - 56) / (PAGE_WIDTH * 2 + 60))));
        } else {
          setScale(1);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcut: Close volume on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Subtle interactive desk parallax tilt
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 4, y: y * -3 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const getChapterIcon = (id: string) => {
    switch (id) {
      case "read":
        return <BookOpen className="h-4 w-4 text-[var(--oxblood)]" />;
      case "discover":
        return <Compass className="h-4 w-4 text-[var(--amber-gold)]" />;
      case "write":
        return <PenTool className="h-4 w-4 text-[var(--oxblood)]" />;
      case "collections":
        return <Layers className="h-4 w-4 text-[var(--forest)]" />;
      case "authors":
        return <Users className="h-4 w-4 text-[var(--oxblood)]" />;
      case "about":
        return <BookMarked className="h-4 w-4 text-[var(--amber-gold)]" />;
      default:
        return <BookOpen className="h-4 w-4 text-[var(--oxblood)]" />;
    }
  };

  // Center active page on mobile (Table of Contents or Colophon), or center spread on desktop
  const stageTranslateX = !isOpen
    ? -PAGE_WIDTH / 2
    : isMobile
    ? mobileFolio === "colophon"
      ? PAGE_WIDTH / 2
      : -PAGE_WIDTH / 2
    : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-center justify-center py-4 sm:py-10 perspective-book select-none w-full max-w-full overflow-x-clip"
      style={{
        minHeight: `${PAGE_HEIGHT * scale + (isMobile ? 36 : 60)}px`,
      }}
    >
      {/* Mobile Folio Tabs (Folio I: Colophon / Folio II: Contents) */}
      {isMobile && isOpen && (
        <div className="flex items-center justify-center gap-2 mb-3 z-40 animate-fade-in touch-manipulation">
          <button
            type="button"
            onClick={() => setMobileFolio("colophon")}
            aria-pressed={mobileFolio === "colophon"}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-full font-editorial-mono text-[9.5px] tracking-widest uppercase transition-all flex items-center gap-1.5 shadow-2xs touch-tactile ${
              mobileFolio === "colophon"
                ? "bg-[var(--oxblood)] text-white font-bold ring-1 ring-[var(--oxblood)]"
                : "bg-[var(--paper-surface)] text-[var(--ink-secondary)] border border-[var(--paper-border)] hover:border-[var(--oxblood)]"
            }`}
          >
            <span>Folio I: Colophon</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileFolio("contents")}
            aria-pressed={mobileFolio === "contents"}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-full font-editorial-mono text-[9.5px] tracking-widest uppercase transition-all flex items-center gap-1.5 shadow-2xs touch-tactile ${
              mobileFolio === "contents"
                ? "bg-[var(--oxblood)] text-white font-bold ring-1 ring-[var(--oxblood)]"
                : "bg-[var(--paper-surface)] text-[var(--ink-secondary)] border border-[var(--paper-border)] hover:border-[var(--oxblood)]"
            }`}
          >
            <span>Folio II: Contents</span>
          </button>
        </div>
      )}

      {/* Scaled 3D Book Stage Container */}
      <div
        className={`preserve-3d ${allowTransition ? "transition-transform duration-1000 ease-out" : ""}`}
        style={{
          transform: `scale(${scale}) translateX(${stageTranslateX}px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          width: `${PAGE_WIDTH * 2}px`,
          height: `${PAGE_HEIGHT}px`,
        }}
      >
        {/* Dynamic Desk Cast Shadow Beneath the Volume */}
        <div
          className={`absolute pointer-events-none rounded-3xl ${allowTransition ? "transition-all duration-1000 ease-out" : ""} ${
            isOpen
              ? "left-2 top-6 right-2 bottom-2 desk-shadow-open opacity-90"
              : "left-[430px] top-6 right-2 bottom-2 desk-shadow-closed opacity-80"
          }`}
          style={{
            zIndex: 1,
          }}
        />

        {/* =====================================================================
            STATIONARY BOOK BASE & RIGHT PAGE BLOCK (Table of Contents)
            ===================================================================== */}
        <div
          className="absolute right-0 top-0 preserve-3d"
          style={{
            width: `${PAGE_WIDTH}px`,
            height: `${PAGE_HEIGHT}px`,
            zIndex: 10,
          }}
        >
          {/* Back Cover Board Overhang (Bottom base board) */}
          <div
            className="absolute -inset-1.5 rounded-r-xl bg-[var(--paper-border)] book-board-bevel pointer-events-none"
            style={{
              transform: "translateZ(-8px)",
              zIndex: -2,
            }}
          />

          {/* 3D Fore-Edge Paper Stack (Right Edge) - 24px Depth */}
          <div
            className="fore-edge-pages absolute right-0 top-1 bottom-1 w-[22px] rounded-r-xs pointer-events-none"
            style={{
              transform: "translateX(20px) rotateY(70deg)",
              transformOrigin: "left center",
              zIndex: -1,
            }}
          />

          {/* Top Head-Edge Paper Stack */}
          <div
            className="head-edge-pages absolute top-0 left-0 right-0 h-[10px] rounded-t-xs pointer-events-none"
            style={{
              transform: "translateY(-8px) rotateX(-75deg)",
              transformOrigin: "bottom center",
              zIndex: -1,
            }}
          />

          {/* Bottom Tail-Edge Paper Stack */}
          <div
            className="head-edge-pages absolute bottom-0 left-0 right-0 h-[10px] rounded-b-xs pointer-events-none"
            style={{
              transform: "translateY(8px) rotateX(75deg)",
              transformOrigin: "top center",
              zIndex: -1,
            }}
          />

          {/* Top Headband at Spine (Decorative Woven Endband) */}
          <div
            className="spine-headband absolute -left-1 -top-1 w-5 h-2 rounded-t-xs pointer-events-none"
            style={{ zIndex: 15 }}
          />

          {/* Bottom Tailband at Spine */}
          <div
            className="spine-headband absolute -left-1 -bottom-1 w-5 h-2 rounded-b-xs pointer-events-none"
            style={{ zIndex: 15 }}
          />

          {/* The Page Leaf Surface: Table of Contents */}
          <div
            className="relative w-full h-full rounded-r-lg border-y border-r border-[var(--paper-border)] bg-[var(--paper-surface)] p-8 sm:p-10 flex flex-col justify-between overflow-hidden shadow-xs page-arch-light-right"
          >
            {/* Center Gutter Left Shadow Overlay on the right page */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/15 to-transparent pointer-events-none z-10" />

            {book ? (
              <div>
                {/* Running Header */}
                <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-2.5 font-editorial-mono text-[9px] tracking-widest uppercase text-[var(--ink-muted)]">
                  <div className="flex items-center gap-1.5">
                    <span>CREATOR WORKSPACE</span>
                    <span className="opacity-40">•</span>
                    <span className="font-bold text-[var(--oxblood)]">{book.state}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fold volume closed"
                    className="inline-flex items-center gap-1 font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors p-1 -mr-1 rounded hover:bg-[var(--paper-warm)] focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] cursor-pointer touch-tactile"
                  >
                    <X className="h-3 w-3" />
                    <span className="hidden sm:inline">Close</span>
                  </button>
                </div>

                {/* Title Section */}
                <div className="mt-5 mb-3">
                  <span className="font-editorial-mono text-[9px] uppercase tracking-[0.25em] text-[var(--oxblood)] font-bold">
                    Manuscript &amp; Studio Tools
                  </span>
                  <h3 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)] mt-0.5 line-clamp-1">
                    {book.title}
                  </h3>
                </div>

                {/* Adaptive Menu List */}
                <nav aria-label="Creator Tools Navigation" className="space-y-1.5 mt-3">
                  {getAdaptiveMenuItems(book.state).map((item, index) => {
                    const isActive = activeChapterIndex === index;
                    const ItemIcon = item.icon;

                    return (
                      <div
                        key={item.key}
                        onMouseEnter={() => setActiveChapterIndex(index)}
                        onClick={() => {
                          if (isOpen) onMenuAction?.(item.key);
                        }}
                        onKeyDown={(e) => {
                          if (isOpen && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            onMenuAction?.(item.key);
                          }
                        }}
                        role="button"
                        tabIndex={isOpen ? 0 : -1}
                        className={`group relative rounded-md p-2.5 border transition-all cursor-pointer select-none touch-manipulation touch-tactile min-h-[46px] ${
                          isActive
                            ? "border-[var(--oxblood)] bg-[var(--paper-warm)] shadow-xs translate-x-1"
                            : "border-transparent hover:border-[var(--paper-border)] hover:bg-[var(--paper-canvas)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start space-x-2.5">
                            <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-[var(--paper-surface)] border border-[var(--paper-border)] shadow-2xs">
                              <ItemIcon className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                            </div>

                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-editorial-mono text-xs font-bold text-[var(--oxblood)]">
                                  {item.roman}.
                                </span>
                                <span className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors">
                                  {item.title}
                                </span>
                              </div>

                              <p className="font-editorial-serif text-[11px] text-[var(--ink-secondary)] leading-snug line-clamp-1">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>

                          <ArrowRight className="h-3 w-3 text-[var(--oxblood)] self-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </nav>
              </div>
            ) : (
              <div>
                {/* Running Header with Quick Close Button */}
                <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-2 font-editorial-mono text-[9px] tracking-widest uppercase text-[var(--ink-muted)]">
                  <div className="flex items-center gap-1.5">
                    <span>LIBER PRIMUS</span>
                    <span className="opacity-40">•</span>
                    <span className="font-bold text-[var(--oxblood)] tracking-[0.2em]">INDEX CAPITULORUM</span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fold volume closed"
                    className="inline-flex items-center gap-1 font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors p-1 -mr-1 rounded hover:bg-[var(--paper-warm)] focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] cursor-pointer touch-tactile"
                  >
                    <X className="h-3 w-3" />
                    <span className="hidden sm:inline">Close</span>
                  </button>
                </div>

                {/* Title Section */}
                <div className="mt-4 mb-2.5">
                  <div className="font-editorial-mono text-[8.5px] uppercase tracking-[0.3em] text-[var(--oxblood)] font-bold">
                    Table of Contents
                  </div>
                  <h3 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)] mt-0.5 tracking-tight">
                    Primary Destinations
                  </h3>
                </div>

                {/* Chapter Items List */}
                <nav aria-label="Table of Contents Navigation" className="space-y-1.5 mt-2.5">
                  {BOOK_CHAPTERS.map((chapter, index) => {
                    const isActive = activeChapterIndex === index;

                    return (
                      <div
                        key={chapter.id}
                        onMouseEnter={() => setActiveChapterIndex(index)}
                        onClick={() => {
                          if (isOpen) onSelectChapter?.(chapter);
                        }}
                        onKeyDown={(e) => {
                          if (isOpen && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            onSelectChapter?.(chapter);
                          }
                        }}
                        role="button"
                        tabIndex={isOpen ? 0 : -1}
                        className={`group relative rounded-md px-3.5 py-2.5 border transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] touch-manipulation touch-tactile min-h-[46px] ${
                          isActive
                            ? "border-l-2 border-l-[var(--oxblood)] border-y-transparent border-r-transparent bg-[var(--paper-warm)] shadow-2xs translate-x-1"
                            : "border-l-2 border-transparent hover:border-l-[var(--oxblood)]/40 hover:bg-[var(--paper-canvas)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2.5 min-w-0">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--paper-surface)] border border-[var(--paper-border)] shadow-2xs">
                              {getChapterIcon(chapter.id)}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-editorial-mono text-xs font-bold text-[var(--oxblood)]">
                                  {chapter.roman}.
                                </span>
                                <span className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors truncate">
                                  {chapter.title}
                                </span>
                              </div>

                              <p className="font-editorial-serif text-[11px] text-[var(--ink-secondary)] leading-snug line-clamp-1">
                                {chapter.subtitle}
                              </p>
                            </div>
                          </div>

                          {/* Dot Leaders & Folio */}
                          <div className="flex items-center space-x-1.5 font-editorial-mono text-[9px] text-[var(--ink-muted)] shrink-0 self-center pl-2">
                            <span className="font-semibold text-[var(--ink-secondary)] group-hover:text-[var(--oxblood)] transition-colors">
                              {chapter.folio}
                            </span>
                            <ArrowRight className="h-3 w-3 text-[var(--oxblood)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Right Page Bottom Folio */}
            <div className="mt-3 pt-2.5 border-t border-[var(--editorial-rule)] flex items-center justify-between font-editorial-mono text-[8.5px] uppercase tracking-widest text-[var(--ink-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--oxblood)]" />
                <span>Tap destination to enter</span>
              </span>
              <span className="text-[var(--oxblood)] font-bold">
                {book
                  ? `Item ${activeChapterIndex + 1} of ${getAdaptiveMenuItems(book.state).length}`
                  : `Chapter ${BOOK_CHAPTERS[activeChapterIndex]?.roman || "I"} of ${BOOK_CHAPTERS.length}`}
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SEWN BINDING CENTER GUTTER & SPARK SEAM
            ===================================================================== */}
        <div
          className={`absolute left-[424px] top-0 bottom-0 w-[12px] gutter-valley-shadow pointer-events-none transition-opacity duration-700 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          style={{ zIndex: 25 }}
        >
          {/* Subtle thread stitches down the gutter */}
          <div className="absolute left-[5px] top-12 bottom-12 flex flex-col justify-between opacity-30">
            <span className="w-[1.5px] h-3 bg-[var(--editorial-rule)]" />
            <span className="w-[1.5px] h-3 bg-[var(--editorial-rule)]" />
            <span className="w-[1.5px] h-3 bg-[var(--editorial-rule)]" />
            <span className="w-[1.5px] h-3 bg-[var(--editorial-rule)]" />
          </div>
        </div>

        {/* =====================================================================
            DRAPED SILK RIBBON BOOKMARK
            ===================================================================== */}
        <div
          className={`silk-ribbon-draped pointer-events-none ${allowTransition ? "transition-all duration-1000 ease-out" : ""} ${
            isOpen
              ? "left-[436px] -top-2 w-[18px] h-[340px] opacity-95 rotate-3"
              : "right-10 -top-3 w-[20px] h-[100px] opacity-100"
          }`}
          style={{ zIndex: 35 }}
        />

        {/* =====================================================================
            THE REVERSIBLE HINGED 3D FRONT COVER ASSEMBLY
            Rotates around its left hinge (X=0) from 0deg (closed) to -180deg (open)
            ===================================================================== */}
        <div
          className={`absolute left-[430px] top-0 preserve-3d ${allowTransition ? "cover-turning-motion" : ""}`}
          style={{
            width: `${PAGE_WIDTH}px`,
            height: `${PAGE_HEIGHT}px`,
            transformOrigin: "0% 50%",
            transform: `rotateY(${isOpen ? -180 : 0}deg)`,
            zIndex: isOpen ? 12 : 30,
          }}
        >
          {/* ===================================================================
              FRONT FACE: The Closed Hardcover Exterior (Visible at 0deg)
              =================================================================== */}
          <div
            role="button"
            tabIndex={isOpen ? -1 : 0}
            aria-label={`Open ${book ? book.title : "INKFORGE: The Living Digital Book"}`}
            onClick={() => {
              if (!isOpen) onOpen();
            }}
            onKeyDown={(e) => {
              if (!isOpen && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onOpen();
              }
            }}
            className={`group absolute inset-0 rounded-r-2xl rounded-l-xs border border-[var(--paper-border)] book-board-bevel p-8 sm:p-10 flex flex-col justify-between text-center backface-hidden cursor-pointer select-none transition-shadow duration-300 overflow-hidden ${
              book ? "book-cloth" : "book-cloth-permanent"
            } ${isOpen ? "pointer-events-none" : "hover:shadow-2xl"}`}
            style={{
              zIndex: 2,
              backgroundColor: activeCover?.palette?.clothColor || undefined,
            }}
          >
            {/* Dynamic Cover Artwork Background if present on author manuscripts */}
            {activeCover?.imageUrl && (
              <>
                <img
                  src={activeCover.imageUrl}
                  alt={book ? book.title : "Cover Artwork"}
                  className="absolute inset-0 w-full h-full object-cover rounded-r-2xl pointer-events-none opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 pointer-events-none rounded-r-2xl" />
              </>
            )}

            {/* Spine Hinge French Groove & Crease (Realistic Joint Indentation) */}
            <div className="french-groove absolute left-6 top-0 bottom-0 w-3 pointer-events-none z-10" />
            <div className="absolute left-0 top-0 bottom-0 w-6 book-spine-crease pointer-events-none z-10" />

            {/* Inset Blind-Debossed Framing Rules with Corner Brackets */}
            <div className="debossed-frame tone-vellum-frame-outer absolute inset-5 sm:inset-7 border border-[#cfa85b]/30 rounded-r-xl pointer-events-none z-10" />
            <div className="tone-vellum-frame-inner absolute inset-7 sm:inset-9 border border-[#cfa85b]/15 rounded-r-lg pointer-events-none z-10" />

            {/* Top Colophon Imprint & Publisher Mark */}
            <div className="relative pt-1 pl-6 z-20 space-y-2">
              {book ? (
                <div>
                  <div className="font-editorial-mono text-[10px] sm:text-xs uppercase tracking-[0.38em] text-[var(--oxblood)] font-bold">
                    {book.genre}
                  </div>
                  <div className="font-editorial-mono text-[8px] uppercase tracking-[0.25em] text-[var(--ink-muted)]">
                    By {book.author}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* Bespoke Geometric Publisher Crest SVG */}
                  <div className="flex justify-center mb-1">
                    <svg
                      viewBox="0 0 40 40"
                      className="w-8 h-8 text-[#d8b065] book-cover-crest transition-transform duration-300 group-hover:scale-105"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      aria-hidden="true"
                    >
                      <polygon points="20,2 38,20 20,38 2,20" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
                      <circle cx="20" cy="20" r="13" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 2" opacity="0.6" />
                      {/* Stylized Nib & Anvil Motif */}
                      <path d="M20 8 L24 17 L20 23 L16 17 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2" />
                      <line x1="20" y1="11" x2="20" y2="20" stroke="currentColor" strokeWidth="1.1" />
                      <circle cx="20" cy="18" r="0.9" fill="currentColor" />
                      <path d="M14 26 L26 26 L24 30 L16 30 Z" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.15" />
                      <circle cx="20" cy="4" r="0.8" fill="currentColor" />
                      <circle cx="4" cy="20" r="0.8" fill="currentColor" />
                      <circle cx="36" cy="20" r="0.8" fill="currentColor" />
                      <circle cx="20" cy="36" r="0.8" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="font-editorial-mono text-[10px] sm:text-[11px] uppercase tracking-[0.4em] font-bold gold-foil-stamp">
                    I N K F O R G E
                  </div>
                  <div className="font-editorial-mono text-[7.5px] uppercase tracking-[0.24em] text-[#a8a192] book-cover-subcolophon">
                    Publishing House &amp; Digital Press
                  </div>
                </div>
              )}
            </div>

            {/* Center Volume Title & Gold Foil Debossing */}
            <div className="relative my-auto py-3 pl-6 z-20 space-y-3.5">
              {book ? (
                <>
                  <div className="font-editorial-mono text-xs uppercase tracking-[0.32em] text-[var(--amber-gold)] font-bold">
                    {book.subtitle ? book.subtitle.slice(0, 36) : "MANUSCRIPT"}
                  </div>
                  <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.12]">
                    {book.title}
                  </h1>
                  <p className="mx-auto max-w-xs font-editorial-serif text-xs sm:text-sm text-[var(--ink-secondary)] italic leading-relaxed line-clamp-2">
                    &ldquo;{book.description}&rdquo;
                  </p>
                  <div className="pt-1 font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--ink-muted)]">
                    {book.mood} • Inkforge Edition
                  </div>
                </>
              ) : (
                <>
                  {/* Central Editorial Cartouche */}
                  <div className="space-y-1.5">
                    <div className="font-editorial-mono text-[8.5px] uppercase tracking-[0.34em] text-[#cfa85b] book-cover-kicker font-semibold">
                      A Living Digital Book
                    </div>
                    <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#fbf8f0] book-cover-title leading-[1.14] drop-shadow-xs">
                      The Sovereign <br /> Written Word
                    </h1>
                  </div>

                  <p className="mx-auto max-w-[275px] font-editorial-serif text-[11px] sm:text-xs text-[#d1cbc0] book-cover-motto italic leading-relaxed">
                    &ldquo;To write with discipline, to publish with permanence, and to treat digital literature with stillness.&rdquo;
                  </p>

                  <div className="pt-1 font-editorial-mono text-[8px] uppercase tracking-[0.28em] text-[#9a9488] book-cover-edition">
                    Continuous Archival Edition • MMXXVI
                  </div>
                </>
              )}
            </div>

            {/* Bottom Invitation to Open: Authentic Letterpress Bookplate Inset */}
            <div className="relative pt-3 border-t border-[#cfa85b]/20 book-cover-bookplate-divider pl-6 space-y-2 z-20">
              {book ? (
                <>
                  <div className="inline-flex items-center space-x-2 rounded-full bg-[var(--oxblood)] px-5 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all group-hover:bg-[var(--oxblood-hover)] group-hover:shadow-md group-hover:scale-[1.02]">
                    <span>Open Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                    Click or press <kbd className="px-1 py-0.5 rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] text-[8px]">Enter</kbd> to unfold
                  </div>
                </>
              ) : (
                <>
                  <div className="letterpress-bookplate mx-auto max-w-[265px] min-h-[44px] rounded-md px-4 py-2.5 flex items-center justify-between transition-all group-hover:scale-[1.02] active:scale-[0.98] touch-manipulation touch-tactile">
                    <span className="font-editorial-mono text-[9.5px] uppercase tracking-[0.2em] font-bold text-[#faebc3] bookplate-label">
                      Unfold Volume
                    </span>
                    <span className="font-editorial-mono text-[9px] text-[#cfa85b] bookplate-action uppercase tracking-wider flex items-center space-x-1 font-semibold">
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1 text-[#faebc3] bookplate-action" />
                    </span>
                  </div>
                  <div className="font-editorial-mono text-[8px] uppercase tracking-widest text-[#9e988c] book-cover-kbd-hint">
                    Click cover or press <kbd className="px-1 py-0.5 rounded border border-[#3e424c] bg-[#1a1b20] book-cover-kbd text-[8px] text-[#ded9cd]">Enter</kbd> to unfold
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ===================================================================
              BACK FACE: Inside Front Endpaper (Left Page when rotated -180deg)
              =================================================================== */}
          <div
            className="absolute inset-0 rounded-l-2xl rounded-r-xs border-y border-l border-[var(--paper-border)] bg-[var(--paper-canvas)] p-8 sm:p-10 flex flex-col justify-between backface-hidden page-arch-light-left shadow-xs"
            style={{
              transform: "rotateY(180deg)",
              zIndex: 1,
            }}
          >
            {/* Center Gutter Right Shadow Overlay on the left page */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/15 to-transparent pointer-events-none z-10" />

            <div>
              {/* Running Header */}
              <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-2.5 font-editorial-mono text-[9px] tracking-widest uppercase text-[var(--ink-muted)]">
                <span>{book ? "EX LIBRIS" : "EX LIBRIS"}</span>
                <span className="font-bold text-[var(--oxblood)]">
                  {book ? book.genre.toUpperCase() : "THE COLOPHON"}
                </span>
                <span>FOLIO I</span>
              </div>

              {/* Frontispiece Vignette */}
              <div className="mt-5 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--paper-border)] bg-[var(--paper-warm)] shadow-xs">
                  <span className="font-editorial-serif text-lg font-bold text-[var(--oxblood)]">
                    ✦
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="font-editorial-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ink-muted)]">
                    {book ? `Author: ${book.author}` : "The Publisher's Imprint"}
                  </div>
                  <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)] line-clamp-1">
                    {book ? book.title : "Inkforge Publishing"}
                  </h2>
                </div>

                {/* Classical Epigraph */}
                <div className="mx-auto max-w-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] p-4 text-left shadow-2xs">
                  <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)] leading-relaxed line-clamp-3">
                    {book
                      ? `"${book.description}"`
                      : "“A digital publishing sanctuary inspired by classical bookmaking, literary journals, and independent presses. Built not to imitate paper, but to give software the enduring stillness and permanence of literature.”"}
                  </p>
                  <div className="mt-2 font-editorial-mono text-[8px] tracking-wider text-[var(--oxblood)] uppercase font-semibold text-right">
                    {book ? `— ${book.author}` : "— The Editorial Preface"}
                  </div>
                </div>
              </div>

              {/* Edition Almanac / Architectural Pillars (Authentic, not fake stats) */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-center font-editorial-mono text-[10px]">
                <div className="rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] p-2.5">
                  <div className="font-bold font-editorial-serif text-sm text-[var(--ink-primary)]">
                    {book ? `${book.chapters.length} Ch.` : "Charter"}
                  </div>
                  <div className="text-[8px] uppercase tracking-wider text-[var(--ink-muted)]">
                    {book ? "Chapters" : "Digital Typeset"}
                  </div>
                </div>

                <div className="rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] p-2.5">
                  <div className="font-bold font-editorial-serif text-sm text-[var(--oxblood)]">
                    {book
                      ? `${book.chapters.reduce((acc, c) => acc + c.wordCount, 0)} w`
                      : "Permanent"}
                  </div>
                  <div className="text-[8px] uppercase tracking-wider text-[var(--ink-muted)]">
                    {book ? "Words" : "Archival Imprint"}
                  </div>
                </div>
              </div>
            </div>

            {/* Left Page Controls */}
            <div className="mt-4 pt-3 border-t border-[var(--editorial-rule)] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center space-x-1.5 font-editorial-sans text-[11px] sm:text-[10px] uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] rounded px-2.5 py-1.5 min-h-[40px] touch-manipulation touch-tactile cursor-pointer"
                title="Fold cover closed"
              >
                <X className="h-3.5 w-3.5" />
                <span>Close Volume (Esc)</span>
              </button>

              {book ? (
                <button
                  type="button"
                  onClick={() => onMenuAction?.("cover")}
                  className="inline-flex items-center space-x-1 font-editorial-sans text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-semibold hover:underline"
                >
                  <span>Edit Identity</span>
                  <Compass className="h-2.5 w-2.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onUnveilFullApp}
                  className="inline-flex items-center space-x-1 font-editorial-sans text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-semibold hover:underline"
                >
                  <span>Read Monograph</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

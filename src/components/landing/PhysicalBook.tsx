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

  // Responsive scale calculator to fit any screen from iPhone to 4K
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        const vw = window.innerWidth;
        if (vw < 520) {
          setScale(Math.max(0.42, (vw - 32) / 880));
        } else if (vw < 768) {
          setScale(Math.max(0.58, (vw - 48) / 920));
        } else if (vw < 1024) {
          setScale(Math.max(0.82, (vw - 64) / 960));
        } else {
          setScale(1);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Dimensions of a single page/board
  const PAGE_WIDTH = 430;
  const PAGE_HEIGHT = 600;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center py-6 sm:py-10 perspective-book select-none"
      style={{
        minHeight: `${PAGE_HEIGHT * scale + 60}px`,
      }}
    >
      {/* Scaled 3D Book Stage Container */}
      <div
        className="preserve-3d transition-transform duration-1000 ease-out"
        style={{
          transform: `scale(${scale}) translateX(${isOpen ? 0 : -PAGE_WIDTH / 2}px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          width: `${PAGE_WIDTH * 2}px`,
          height: `${PAGE_HEIGHT}px`,
        }}
      >
        {/* Dynamic Desk Cast Shadow Beneath the Volume */}
        <div
          className={`absolute pointer-events-none rounded-3xl transition-all duration-1000 ease-out ${
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
                  <span>CREATOR WORKSPACE</span>
                  <span className="font-bold text-[var(--oxblood)]">{book.state}</span>
                  <span>FOLIO 2</span>
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
                        className={`group relative rounded-md p-2.5 border transition-all cursor-pointer select-none ${
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
                {/* Running Header */}
                <div className="flex items-center justify-between border-b border-[var(--editorial-rule)] pb-2.5 font-editorial-mono text-[9px] tracking-widest uppercase text-[var(--ink-muted)]">
                  <span className="font-bold text-[var(--oxblood)]">INKFORGE</span>
                  <span className="font-bold text-[var(--ink-primary)]">PRIMARY DESTINATIONS</span>
                  <span>p. 2</span>
                </div>

                {/* Title Section */}
                <div className="mt-5 mb-3">
                  <span className="font-editorial-mono text-[9px] uppercase tracking-[0.25em] text-[var(--oxblood)] font-bold">
                    Write • Publish • Discover • Read
                  </span>
                  <h3 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)] mt-0.5">
                    Choose Where to Begin
                  </h3>
                </div>

                {/* Chapter Items List */}
                <nav aria-label="Table of Contents Navigation" className="space-y-1.5 mt-3">
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
                        className={`group relative rounded-md p-2.5 border transition-all cursor-pointer select-none ${
                          isActive
                            ? "border-[var(--oxblood)] bg-[var(--paper-warm)] shadow-xs translate-x-1"
                            : "border-transparent hover:border-[var(--paper-border)] hover:bg-[var(--paper-canvas)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start space-x-2.5">
                            <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-[var(--paper-surface)] border border-[var(--paper-border)] shadow-2xs">
                              {getChapterIcon(chapter.id)}
                            </div>

                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-editorial-mono text-xs font-bold text-[var(--oxblood)]">
                                  {chapter.roman}.
                                </span>
                                <span className="font-editorial-serif text-sm font-bold text-[var(--ink-primary)] group-hover:text-[var(--oxblood)] transition-colors">
                                  {chapter.title}
                                </span>
                              </div>

                              <p className="font-editorial-serif text-[11px] text-[var(--ink-secondary)] leading-snug line-clamp-1">
                                {chapter.subtitle}
                              </p>
                            </div>
                          </div>

                          {/* Dot Leaders & Folio */}
                          <div className="flex items-center space-x-1.5 font-editorial-mono text-[9px] text-[var(--ink-muted)] shrink-0 self-center">
                            <span className="hidden sm:inline tracking-tighter opacity-35">
                              . . .
                            </span>
                            <span className="font-semibold">{chapter.folio}</span>
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
            <div className="mt-4 pt-3 border-t border-[var(--editorial-rule)] flex items-center justify-between font-editorial-mono text-[8px] uppercase tracking-wider text-[var(--ink-muted)]">
              <span>Select destination to enter</span>
              <span className="text-[var(--oxblood)] font-bold">
                Chapter {BOOK_CHAPTERS[activeChapterIndex].roman} of VI
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
          className={`silk-ribbon-draped pointer-events-none transition-all duration-1000 ease-out ${
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
          className="absolute left-[430px] top-0 preserve-3d cover-turning-motion"
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
            aria-label={`Open ${book ? book.title : "INKFORGE Volume IV"} interactive book`}
            onClick={() => {
              if (!isOpen) onOpen();
            }}
            onKeyDown={(e) => {
              if (!isOpen && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onOpen();
              }
            }}
            className={`group absolute inset-0 rounded-r-2xl rounded-l-xs border border-[var(--paper-border)] book-cloth book-board-bevel p-8 sm:p-10 flex flex-col justify-between text-center backface-hidden cursor-pointer select-none transition-shadow duration-300 overflow-hidden ${
              isOpen ? "pointer-events-none" : "hover:shadow-2xl"
            }`}
            style={{
              zIndex: 2,
              backgroundColor: activeCover?.palette?.clothColor || undefined,
            }}
          >
            {/* Dynamic Cover Artwork Background if present */}
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

            {/* Spine Hinge Left Groove Crease */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/25 via-white/5 to-black/15 pointer-events-none z-10" />
            <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-[var(--editorial-rule)] opacity-60 pointer-events-none z-10" />

            {/* Inset Blind-Debossed Decorative Frame */}
            <div className="debossed-frame absolute inset-6 sm:inset-8 border border-[var(--paper-border)]/60 rounded-r-xl pointer-events-none z-10" />
            <div className="absolute inset-8 sm:inset-10 border border-[var(--editorial-rule)]/40 opacity-35 rounded-r-lg pointer-events-none z-10" />

            {/* Top Colophon Imprint */}
            <div className="relative pt-2 space-y-1 pl-6 z-20">
              <div className="font-editorial-mono text-[10px] sm:text-xs uppercase tracking-[0.38em] text-[var(--oxblood)] font-bold">
                {book ? book.genre : "I N K F O R G E"}
              </div>
              <div className="font-editorial-mono text-[8px] uppercase tracking-[0.25em] text-[var(--ink-muted)]">
                {book ? `By ${book.author}` : "Publishing House & Reader • Continuous Edition"}
              </div>
            </div>

            {/* Center Volume Title & Gold Foil Debossing */}
            <div className="relative my-auto py-4 space-y-4 pl-6 z-20">
              {/* Embossed Blind-Stamped Roundel */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--paper-border)] bg-[var(--paper-warm)] shadow-xs transition-transform group-hover:scale-105">
                <span className="font-editorial-serif text-2xl font-bold text-[var(--oxblood)]">
                  ❦
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="font-editorial-mono text-xs uppercase tracking-[0.32em] text-[var(--amber-gold)] font-bold">
                  {book ? (book.subtitle ? book.subtitle.slice(0, 36) : "MANUSCRIPT") : "VOLUME IV"}
                </div>
                <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.12]">
                  {book ? book.title : <>A Living <br /> Digital Book</>}
                </h1>
              </div>

              <p className="mx-auto max-w-xs font-editorial-serif text-xs sm:text-sm text-[var(--ink-secondary)] italic leading-relaxed line-clamp-2">
                {book ? `"${book.description}"` : `“Crafting systems that endure: the philosophy of long-horizon software.”`}
              </p>

              <div className="pt-1 font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--ink-muted)]">
                {book ? `${book.mood} • Inkforge Edition` : "Autumn MMXXVI • Press IF-2026"}
              </div>
            </div>

            {/* Bottom Invitation to Open */}
            <div className="relative pt-4 border-t border-[var(--editorial-rule)] pl-6 space-y-2.5 z-20">
              <div className="inline-flex items-center space-x-2 rounded-full bg-[var(--oxblood)] px-5 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all group-hover:bg-[var(--oxblood-hover)] group-hover:shadow-md group-hover:scale-[1.02]">
                <span>{book ? "Open Workspace" : "Open Volume IV"}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>

              <div className="font-editorial-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                Click or press <kbd className="px-1 py-0.5 rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] text-[8px]">Enter</kbd> to unfold
              </div>
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
                <span>{book ? "EX LIBRIS" : "FOLIO IV"}</span>
                <span className="font-bold text-[var(--oxblood)]">
                  {book ? book.genre.toUpperCase() : "AUTUMN MMXXVI"}
                </span>
                <span>p. 1</span>
              </div>

              {/* Frontispiece Vignette */}
              <div className="mt-6 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--paper-border)] bg-[var(--paper-warm)] shadow-xs">
                  <span className="font-editorial-serif text-lg font-bold text-[var(--oxblood)]">
                    ✦
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="font-editorial-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ink-muted)]">
                    {book ? `Author: ${book.author}` : "The Scribe's Frontispiece"}
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
                      : "“A digital publishing platform inspired by books, literary journals, and independent presses. Built not to imitate paper, but to give software the enduring stillness of literature.”"}
                  </p>
                  <div className="mt-2 font-editorial-mono text-[8px] tracking-wider text-[var(--oxblood)] uppercase font-semibold text-right">
                    {book ? `— ${book.author}` : "— The Editorial Preface"}
                  </div>
                </div>
              </div>

              {/* Edition Almanac / Book Metrics */}
              <div className="mt-6 grid grid-cols-2 gap-2 text-center font-editorial-mono text-[10px]">
                <div className="rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] p-2">
                  <div className="font-bold font-editorial-serif text-sm text-[var(--ink-primary)]">
                    {book ? `${book.chapters.length} Ch.` : "38"}
                  </div>
                  <div className="text-[8px] uppercase tracking-wider text-[var(--ink-muted)]">
                    {book ? "Chapters" : "Monographs"}
                  </div>
                </div>

                <div className="rounded border border-[var(--paper-border)] bg-[var(--paper-warm)] p-2">
                  <div className="font-bold font-editorial-serif text-sm text-[var(--oxblood)]">
                    {book
                      ? `${book.chapters.reduce((acc, c) => acc + c.wordCount, 0)} w`
                      : "100%"}
                  </div>
                  <div className="text-[8px] uppercase tracking-wider text-[var(--ink-muted)]">
                    {book ? "Words" : "Local Scribe"}
                  </div>
                </div>
              </div>
            </div>

            {/* Left Page Controls */}
            <div className="mt-4 pt-3 border-t border-[var(--editorial-rule)] flex items-center justify-between text-xs">
              <button
                onClick={onClose}
                className="inline-flex items-center space-x-1.5 font-editorial-sans text-[10px] uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors"
                title="Fold cover closed"
              >
                <X className="h-3 w-3" />
                <span>Close Cover</span>
              </button>

              {book ? (
                <button
                  onClick={() => onMenuAction?.("cover")}
                  className="inline-flex items-center space-x-1 font-editorial-sans text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-semibold hover:underline"
                >
                  <span>Edit Identity</span>
                  <Compass className="h-2.5 w-2.5" />
                </button>
              ) : (
                <button
                  onClick={onUnveilFullApp}
                  className="inline-flex items-center space-x-1 font-editorial-sans text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-semibold hover:underline"
                >
                  <span>Direct to Gazetteer</span>
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

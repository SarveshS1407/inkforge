"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEdition, PaperTone } from "@/components/theme/EditionContext";
import { SignInModal } from "@/components/auth/SignInModal";
import {
  BookOpen,
  Compass,
  PenTool,
  Layers,
  Users,
  HelpCircle,
  Info,
  Menu,
  X,
  User,
} from "lucide-react";

export function Header() {
  const { tone, setTone } = useEdition();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  const tones: { id: PaperTone; label: string; swatch: string }[] = [
    { id: "cotton", label: "Cotton", swatch: "bg-[#fbf9f4] border-[#e4dccb]" },
    { id: "vellum", label: "Vellum", swatch: "bg-[#f4eee2] border-[#d7c7ab]" },
    { id: "inkwell", label: "Buckram", swatch: "bg-[#16171b] border-[#2a2d35]" },
  ];

  const primaryNav = [
    { label: "Read", href: "/read/crafting-systems-that-endure", icon: BookOpen },
    { label: "Discover", href: "/discover", icon: Compass },
    { label: "Write", href: "/write", icon: PenTool },
  ];

  const secondaryNav = [
    { label: "Collections", href: "/collections", icon: Layers },
    { label: "Authors", href: "/authors", icon: Users },
  ];

  const utilityNav = [
    { label: "Help", href: "/help", icon: HelpCircle },
    { label: "About", href: "/about", icon: Info },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--paper-border)] bg-[var(--paper-canvas)]/95 backdrop-blur-md transition-colors">
        {/* Top Editorial Running Strip */}
        <div className="border-b border-[var(--paper-border-subtle)] px-4 py-1 font-editorial-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-[var(--ink-muted)]">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[var(--oxblood)]">INKFORGE</span>
              <span>•</span>
              <span>WRITE. PUBLISH. DISCOVER. READ.</span>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <Link href="/about" className="hover:text-[var(--ink-primary)] transition-colors">
                About the Platform
              </Link>
              <span>•</span>
              <Link href="/help" className="hover:text-[var(--ink-primary)] transition-colors">
                Help &amp; FAQ
              </Link>
            </div>
          </div>
        </div>

        {/* Main Masthead Navigation Bar */}
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Brand Colophon Logo */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="group flex flex-col focus:outline-none">
              <span className="font-editorial-serif text-lg sm:text-xl font-bold tracking-[0.25em] text-[var(--ink-primary)] transition-colors group-hover:text-[var(--oxblood)]">
                INKFORGE
              </span>
              <span className="font-editorial-mono text-[8px] tracking-[0.28em] uppercase text-[var(--ink-muted)] hidden sm:block">
                A Living Editorial Space
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center space-x-1 font-editorial-sans text-xs uppercase tracking-wider font-semibold text-[var(--ink-secondary)]"
            >
              {primaryNav.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      isActive
                        ? "text-[var(--oxblood)] font-bold bg-[var(--paper-warm)] shadow-xs"
                        : "hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)]/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <span className="h-3 w-[1px] bg-[var(--editorial-rule)] mx-1 opacity-60" />

              {secondaryNav.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                      isActive
                        ? "text-[var(--oxblood)] font-bold bg-[var(--paper-warm)] shadow-xs"
                        : "hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)]/60 text-[var(--ink-muted)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Utilities: Paper Selector, Write CTA, Sign In */}
          <div className="flex items-center space-x-3">
            {/* Paper Tone Selector */}
            <div className="hidden lg:flex items-center space-x-1 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] p-1 shadow-xs">
              {tones.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-editorial-mono uppercase tracking-wider transition-all ${
                    tone === t.id
                      ? "bg-[var(--paper-warm)] font-bold text-[var(--ink-primary)] shadow-xs border border-[var(--paper-border)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  }`}
                  title={`Switch to ${t.label} Paper Tone`}
                >
                  <span className={`inline-block h-2 w-2 rounded-full border ${t.swatch}`} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Write CTA Button */}
            <Link
              href="/write"
              className="flex items-center space-x-1.5 rounded-md bg-[var(--oxblood)] px-3 py-1.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--oxblood-hover)] hover:shadow-sm active:scale-[0.98]"
            >
              <PenTool className="h-3 w-3" />
              <span>Write</span>
            </Link>

            {/* Sign In Button */}
            <button
              type="button"
              onClick={() => setSignInOpen(true)}
              className="hidden sm:flex items-center space-x-1 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 py-1.5 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors"
            >
              <User className="h-3 w-3 text-[var(--ink-muted)]" />
              <span>Sign In</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden rounded-md p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-4 space-y-4 shadow-lg animate-fade-in">
            {/* Primary Actions */}
            <div className="space-y-1">
              <span className="font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--oxblood)] font-bold block mb-1">
                Primary Destinations
              </span>
              {primaryNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md font-editorial-sans text-xs uppercase tracking-wider font-semibold text-[var(--ink-primary)] hover:bg-[var(--paper-warm)]"
                >
                  <item.icon className="h-4 w-4 text-[var(--oxblood)]" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Secondary Actions */}
            <div className="border-t border-[var(--editorial-rule)] pt-3 space-y-1">
              <span className="font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--ink-muted)] font-bold block mb-1">
                Explore More
              </span>
              {secondaryNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-md font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-secondary)] hover:bg-[var(--paper-warm)]"
                >
                  <item.icon className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Utility Actions */}
            <div className="border-t border-[var(--editorial-rule)] pt-3 flex items-center justify-between font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
              {utilityNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-[var(--oxblood)]"
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSignInOpen(true);
                }}
                className="text-[var(--oxblood)] font-bold"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Sign In Modal */}
      <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}

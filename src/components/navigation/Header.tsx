"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeSelector } from "@/components/theme/ThemeSelector";
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
  FileText,
  ChevronDown,
  LogOut,
  Edit3,
} from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: string;
  avatarUrl: string | null;
  emailVerified: string | null;
}

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (!user || resendingVerification || resendCooldown > 0) return;
    setResendingVerification(true);
    setResendStatus(null);
    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.data?.delivery === "local") {
          setResendStatus("Link in terminal (local dev)");
        } else if (data.data?.delivery === "resend") {
          setResendStatus("Link dispatched to inbox!");
        } else {
          setResendStatus(data.data?.message || "Link processed");
        }
        setResendCooldown(60);
      } else {
        setResendStatus(data.error?.message || "Failed to dispatch");
      }
    } catch {
      setResendStatus("Network error");
    } finally {
      setResendingVerification(false);
    }
  };

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    const handleAuthChange = () => {
      checkAuth();
    };
    const handleOpenSignIn = () => {
      setSignInOpen(true);
    };
    window.addEventListener("inkforge_auth_change", handleAuthChange);
    window.addEventListener("inkforge_open_signin", handleOpenSignIn);
    return () => {
      window.removeEventListener("inkforge_auth_change", handleAuthChange);
      window.removeEventListener("inkforge_open_signin", handleOpenSignIn);
    };
  }, [checkAuth]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      window.dispatchEvent(new Event("inkforge_auth_change"));
    }
  };

  const primaryNav = [
    {
      label: "Read",
      href: "/read/crafting-systems-that-endure",
      icon: BookOpen,
      isActive: pathname.startsWith("/read"),
    },
    {
      label: "Discover",
      href: "/discover",
      icon: Compass,
      isActive: pathname.startsWith("/discover"),
    },
    {
      label: "Write",
      href: "/write",
      icon: PenTool,
      isActive: pathname.startsWith("/write") || pathname.startsWith("/posts"),
    },
  ];

  const secondaryNav = [
    {
      label: "Collections",
      href: "/collections",
      icon: Layers,
      isActive: pathname.startsWith("/collections"),
    },
    {
      label: "Authors",
      href: "/authors",
      icon: Users,
      isActive: pathname.startsWith("/authors"),
    },
  ];

  const utilityNav = [
    {
      label: "About",
      href: "/about",
      icon: Info,
      isActive: pathname.startsWith("/about"),
    },
    {
      label: "Help",
      href: "/help",
      icon: HelpCircle,
      isActive: pathname.startsWith("/help"),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--editorial-rule)] bg-[var(--paper-canvas)]/95 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* =========================================================
              1. BRAND AREA (Left Anchor)
              Wordmark with integrated product promise subtitle
             ========================================================= */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <Link
              href="/"
              className="group flex flex-col focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] rounded-md py-1 pr-2"
            >
              <span className="block font-editorial-serif text-xl sm:text-2xl font-bold tracking-[0.2em] text-[var(--ink-primary)] transition-colors group-hover:text-[var(--oxblood)] leading-none">
                INKFORGE
              </span>
              <span className="block font-editorial-mono text-[8px] tracking-[0.22em] uppercase text-[var(--ink-muted)] mt-1 hidden sm:block">
                Write • Publish • Discover • Read
              </span>
            </Link>

            {/* =======================================================
                2. PRIMARY & SECONDARY NAVIGATION (Desktop / Tablet)
                Harmonized navigation hub with clear 2-tier hierarchy
               ======================================================= */}
            <nav
              aria-label="Main Navigation"
              className="hidden md:flex items-center space-x-1 pl-4 sm:pl-6 border-l border-[var(--editorial-rule)]"
            >
              {/* Primary Group: Read · Discover · Write */}
              <div className="flex items-center space-x-1">
                {primaryNav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-editorial-sans text-xs uppercase tracking-wider font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] ${
                      item.isActive
                        ? "text-[var(--oxblood)] font-bold bg-[var(--paper-warm)] shadow-2xs"
                        : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)]/70"
                    }`}
                  >
                    <item.icon
                      className={`h-3.5 w-3.5 ${
                        item.isActive ? "text-[var(--oxblood)]" : "text-[var(--ink-muted)]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Editorial Hairline Divider */}
              <span
                className="h-4 w-[1px] bg-[var(--editorial-rule)] mx-2 opacity-60"
                aria-hidden="true"
              />

              {/* Secondary Group: Collections · Authors (Quieter hierarchy) */}
              <div className="flex items-center space-x-1">
                {secondaryNav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md font-editorial-sans text-[11px] font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] ${
                      item.isActive
                        ? "text-[var(--oxblood)] font-bold bg-[var(--paper-warm)] shadow-2xs"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)]/60"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {/* =========================================================
              3. UTILITY & ACCOUNT AREA (Right Anchor)
              Unified 32px height controls: About/Help + Paper Tone + Account
             ========================================================= */}
          <div className="flex items-center space-x-3">
            {/* Utility Links: About · Help (Desktop lg+) */}
            <div className="hidden lg:flex items-center space-x-1 font-editorial-mono text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
              {utilityNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-2 py-1 rounded transition-colors hover:text-[var(--oxblood)] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[var(--oxblood)] ${
                    item.isActive ? "text-[var(--oxblood)] font-bold" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Hairline Divider before controls (Desktop lg+) */}
            <span
              className="hidden lg:block h-4 w-[1px] bg-[var(--editorial-rule)] opacity-60"
              aria-hidden="true"
            />

            {/* Unified Theme Selector Dropdown (Uniform 32px height) */}
            <ThemeSelector variant="header" />

            {/* Account / User Profile Controls (Uniform 32px height) */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  className="h-8 flex items-center space-x-2 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-2.5 font-editorial-sans text-xs tracking-wider text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)]"
                >
                  <div className="w-5 h-5 rounded-full bg-[var(--oxblood)]/15 text-[var(--oxblood)] flex items-center justify-center font-editorial-mono text-[10px] font-bold">
                    {(user.displayName || user.username || "A").charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate text-xs font-medium text-[var(--ink-primary)] hidden sm:inline-block">
                    {user.displayName || user.username}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 text-[var(--ink-muted)] transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border border-[var(--editorial-rule)] bg-[var(--paper-surface)] p-2 shadow-xl z-50 animate-fade-in space-y-1">
                    <div className="px-3 py-2 border-b border-[var(--editorial-rule)]/60 mb-1">
                      <p className="font-editorial-serif font-bold text-sm text-[var(--ink-primary)] truncate">
                        {user.displayName || user.username}
                      </p>
                      <p className="font-editorial-mono text-[10px] text-[var(--ink-muted)] truncate">
                        {user.email}
                      </p>

                      {user.emailVerified ? (
                        <div className="mt-1 flex items-center gap-1.5 text-[9px] font-editorial-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                          <span>Verified Imprint</span>
                        </div>
                      ) : (
                        <div className="mt-2 rounded border border-[var(--amber-gold)]/30 bg-[var(--paper-warm)] p-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-editorial-mono">
                            <span className="text-[var(--amber-gold)] font-bold flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber-gold)] animate-pulse" />
                              Unverified
                            </span>
                            <button
                              type="button"
                              onClick={handleResendVerification}
                              disabled={resendingVerification || resendCooldown > 0}
                              className="text-[var(--oxblood)] hover:underline font-semibold disabled:opacity-50"
                            >
                              {resendingVerification
                                ? "Sending..."
                                : resendCooldown > 0
                                ? `${resendCooldown}s`
                                : "Resend Link"}
                            </button>
                          </div>
                          {resendStatus && (
                            <p
                              title={resendStatus}
                              className="text-[8.5px] text-[var(--ink-secondary)] font-editorial-mono leading-tight"
                            >
                              {resendStatus}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/authors/${user.username}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded text-xs font-editorial-sans text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-[var(--amber-gold)]" />
                      <span>My Public Profile</span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded text-xs font-editorial-sans text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                      <span>Edit Author Profile</span>
                    </Link>

                    <Link
                      href="/posts"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded text-xs font-editorial-sans text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                      <span>My Drafts &amp; Ledger</span>
                    </Link>

                    <Link
                      href="/write"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded text-xs font-editorial-sans text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors"
                    >
                      <PenTool className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                      <span>Write New Piece</span>
                    </Link>

                    <div className="border-t border-[var(--editorial-rule)]/60 my-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded text-xs font-editorial-sans text-red-600 dark:text-red-400 hover:bg-[var(--paper-warm)] transition-colors text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSignInOpen(true)}
                aria-haspopup="dialog"
                className="h-8 flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3 font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)]"
              >
                <User className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                <span>Account</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button (44x44px touch target) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* =========================================================
            4. MOBILE DROPDOWN DRAWER
            Preserving 100% of options with clean, organized grouping
           ========================================================= */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--paper-border)] bg-[var(--paper-surface)] px-4 py-5 space-y-5 shadow-xl animate-fade-in">
            {/* Primary Destinations */}
            <div className="space-y-1.5">
              <span className="font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--oxblood)] font-bold block mb-1">
                Primary Destinations
              </span>
              {primaryNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 min-h-[44px] rounded-md font-editorial-sans text-xs uppercase tracking-wider font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] ${
                    item.isActive
                      ? "text-[var(--oxblood)] bg-[var(--paper-warm)] font-bold"
                      : "text-[var(--ink-primary)] hover:bg-[var(--paper-warm)]"
                  }`}
                >
                  <item.icon className="h-4 w-4 text-[var(--oxblood)]" />
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Creator Drafts Quick Link */}
              <Link
                href="/posts"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 min-h-[44px] rounded-md font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-secondary)] hover:bg-[var(--paper-warm)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)]"
              >
                <FileText className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                <span>Editorial Ledger &amp; Drafts</span>
              </Link>
            </div>

            {/* Secondary Destinations */}
            <div className="border-t border-[var(--editorial-rule)] pt-3.5 space-y-1">
              <span className="font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--ink-muted)] font-bold block mb-1">
                Explore The Archive
              </span>
              {secondaryNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 min-h-[44px] rounded-md font-editorial-sans text-xs uppercase tracking-wider transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] ${
                    item.isActive
                      ? "text-[var(--oxblood)] bg-[var(--paper-warm)] font-bold"
                      : "text-[var(--ink-secondary)] hover:bg-[var(--paper-warm)]"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Author Folio Workspace (Mobile Drawer) */}
            {user && (
              <div className="border-t border-[var(--editorial-rule)] pt-3.5 space-y-1">
                <span className="font-editorial-mono text-[9px] uppercase tracking-widest text-[var(--oxblood)] font-bold block mb-1">
                  Author Folio &amp; Workspace
                </span>
                <Link
                  href={`/authors/${user.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 min-h-[44px] rounded-md font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-secondary)] hover:bg-[var(--paper-warm)] transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-[var(--amber-gold)]" />
                  <span>My Public Profile</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 min-h-[44px] rounded-md font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-secondary)] hover:bg-[var(--paper-warm)] transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                  <span>Edit Author Profile</span>
                </Link>
                <Link
                  href="/posts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 min-h-[44px] rounded-md font-editorial-sans text-xs uppercase tracking-wider text-[var(--ink-secondary)] hover:bg-[var(--paper-warm)] transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-[var(--oxblood)]" />
                  <span>My Drafts &amp; Ledger</span>
                </Link>
              </div>
            )}

            {/* Reading Theme Selector (Mobile Drawer Edition) */}
            <div className="border-t border-[var(--editorial-rule)] pt-3.5">
              <ThemeSelector variant="mobile-drawer" />
            </div>

            {/* Utility Actions */}
            <div className="border-t border-[var(--editorial-rule)] pt-3.5 flex items-center justify-between font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
              {utilityNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] flex items-center hover:text-[var(--oxblood)] transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[var(--oxblood)]"
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-[44px] text-red-600 dark:text-red-400 font-bold flex items-center space-x-1 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-red-500"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSignInOpen(true);
                  }}
                  className="min-h-[44px] text-[var(--oxblood)] font-bold flex items-center space-x-1 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[var(--oxblood)]"
                >
                  <User className="h-3 w-3" />
                  <span>Account</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Sign In / Account Modal */}
      <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}

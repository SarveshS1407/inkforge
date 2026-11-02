"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Feather, CheckCircle2, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPortal?: "TECH" | "READER" | "AUTHOR";
}

type AuthMode = "signin" | "register" | "forgot";

export function SignInModal({ isOpen, onClose, initialPortal = "AUTHOR" }: SignInModalProps) {
  const [selectedPortal, setSelectedPortal] = useState<"TECH" | "READER" | "AUTHOR">(initialPortal);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync initialPortal prop when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedPortal(initialPortal);
      if (initialPortal === "TECH") {
        setMode("signin");
      }
    }
  }, [isOpen, initialPortal]);

  // Explicit close handler giving the user total control over dismissal
  const handleExplicitClose = useCallback(() => {
    // Notify application to sync auth state in case login/register occurred
    window.dispatchEvent(new Event("inkforge_auth_change"));
    onClose();
    // Clean up transient state
    setSuccessMessage(null);
    setErrorMessage(null);
    setPassword("");
    setIsSubmitting(false);
  }, [onClose]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleExplicitClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleExplicitClose]);

  // Reset transient error and password states when modal is opened
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setPassword("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent accidental multi-submissions from rapid clicks or Enter presses
    if (isSubmitting || successMessage) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            portal: selectedPortal,
          }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Invalid credentials. Please verify your email and password.");
        }

        // Notify background listeners immediately
        window.dispatchEvent(new Event("inkforge_auth_change"));

        const roleBadge = data.data?.role === "TECH" ? "Tech Administrator" : data.data?.role === "AUTHOR" ? "Author" : "Reader";
        setSuccessMessage(`Welcome back, ${data.data?.displayName || data.data?.username}! Your ${roleBadge} session is active.`);
      } else if (mode === "register") {
        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            username: username.trim(),
            displayName: displayName.trim() || undefined,
            role: selectedPortal === "AUTHOR" ? "AUTHOR" : "READER",
            inviteCode: selectedPortal === "AUTHOR" ? inviteCode.trim() : undefined,
          }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Registration failed.");
        }

        window.dispatchEvent(new Event("inkforge_auth_change"));

        setSuccessMessage(
          selectedPortal === "AUTHOR"
            ? "Author folio created successfully! Your writing studio is ready."
            : "Reader sanctuary account created! You can now bookmark and collect monographs."
        );
      } else if (mode === "forgot") {
        const res = await fetch("/api/v1/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Unable to dispatch recovery link.");
        }

        setSuccessMessage(
          data.data?.message ||
            "If an account exists with this email, a single-use password recovery link has been dispatched."
        );
      }
    } catch (err: unknown) {
      // On failure: keep modal open, preserve email address, report clear error
      setErrorMessage(err instanceof Error ? err.message : "Authentication request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-modal-title"
      onClick={handleExplicitClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8 shadow-2xl space-y-5"
      >
        {/* Close Button (Explicit User Control) */}
        <button
          onClick={handleExplicitClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-md p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Portal Switcher Tabs */}
        <div className="flex rounded-lg border border-[var(--paper-border)] bg-[var(--paper-canvas)] p-1 text-xs font-editorial-mono">
          <button
            type="button"
            onClick={() => {
              setSelectedPortal("READER");
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors cursor-pointer ${
              selectedPortal === "READER"
                ? "bg-[var(--paper-surface)] text-[var(--ink-primary)] font-bold shadow-2xs border border-[var(--paper-border)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Reader
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPortal("AUTHOR");
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors cursor-pointer ${
              selectedPortal === "AUTHOR"
                ? "bg-[var(--oxblood)] text-white font-bold shadow-2xs"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Author
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPortal("TECH");
              setMode("signin");
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors cursor-pointer ${
              selectedPortal === "TECH"
                ? "bg-[var(--paper-surface)] text-amber-700 dark:text-amber-400 font-bold shadow-2xs border border-amber-500/30"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Tech Admin
          </button>
        </div>

        {/* Modal Masthead */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
            <Feather className="h-3.5 w-3.5" />
            <span>
              {selectedPortal === "TECH"
                ? "Platform Console"
                : selectedPortal === "READER"
                ? "Reader Sanctuary"
                : "Author Atelier"}
              {" • "}
              {mode === "signin"
                ? "Sign In"
                : mode === "register"
                ? "New Account"
                : "Recovery"}
            </span>
          </div>
          <h2
            id="sign-in-modal-title"
            className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]"
          >
            {selectedPortal === "TECH"
              ? "Technical Administration"
              : selectedPortal === "READER"
              ? "Reader Sanctuary"
              : "Author Sanctuary"}
          </h2>
          <p className="font-editorial-serif italic text-xs text-[var(--ink-secondary)] leading-relaxed">
            {selectedPortal === "TECH"
              ? "Restricted access to system telemetry, content governance, and database migration tooling."
              : selectedPortal === "READER"
              ? "Explore the living press, save monographs, and discover voices across the independent web."
              : "Inscribe your books, import Word & PDF manuscripts, customize physical covers, and publish."}
          </p>
        </div>

        {/* Error Alert (Displayed on failure while keeping form open & email preserved) */}
        {errorMessage && (
          <div className="rounded-lg bg-[var(--paper-warm)] border border-[var(--oxblood)]/40 p-3 flex items-start space-x-2 text-xs text-[var(--oxblood)] font-editorial-sans animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* State A: Explicit Success View */}
        {successMessage ? (
          <div className="space-y-5 text-center animate-fade-in py-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--paper-warm)] border border-[var(--paper-border)] shadow-2xs">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-editorial-serif text-lg sm:text-xl font-bold text-[var(--ink-primary)]">
                {mode === "signin"
                  ? "Authentication Confirmed"
                  : mode === "register"
                  ? "Author Folio Ready"
                  : "Recovery Dispatched"}
              </h3>
              <p className="font-editorial-sans text-xs text-[var(--ink-secondary)] leading-relaxed max-w-sm mx-auto">
                {successMessage}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setSuccessMessage(null);
                    setErrorMessage(null);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] px-5 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all cursor-pointer"
                >
                  <span>Return to Sign In</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExplicitClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] px-5 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all cursor-pointer"
                >
                  <span>{mode === "signin" ? "Continue to Writing Studio" : "Proceed to Sanctuary"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <p className="font-editorial-mono text-[10px] text-[var(--ink-muted)]">
              Click &quot;Continue&quot; or press Escape to close this window.
            </p>
          </div>
        ) : (
          /* State B: Active Form View */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="author@independentpress.org"
                disabled={isSubmitting}
                className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 sm:py-1.5 font-editorial-sans text-base sm:text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/60 focus:border-[var(--oxblood)] focus:outline-hidden shadow-2xs disabled:opacity-50"
              />
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="elena-rostova"
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 sm:py-1.5 font-editorial-sans text-base sm:text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/60 focus:border-[var(--oxblood)] focus:outline-hidden shadow-2xs disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-bold mb-1">
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Elena Rostova"
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 sm:py-1.5 font-editorial-sans text-base sm:text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/60 focus:border-[var(--oxblood)] focus:outline-hidden shadow-2xs disabled:opacity-50"
                  />
                </div>

                {selectedPortal === "AUTHOR" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold">
                        Author Invitation Passcode
                      </label>
                      <span className="text-[9px] font-editorial-mono text-[var(--oxblood)]">
                        Required
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="e.g. INKFORGE-AUTHOR-2026"
                      disabled={isSubmitting}
                      className="w-full rounded-md border border-[var(--oxblood)]/40 bg-[var(--paper-canvas)] px-3 py-2 sm:py-1.5 font-editorial-mono text-base sm:text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/60 focus:border-[var(--oxblood)] focus:outline-hidden shadow-2xs disabled:opacity-50"
                    />
                    <p className="mt-1 font-editorial-serif italic text-[11px] text-[var(--ink-muted)]">
                      Author registration is invitation-only during the pilot sprint.
                    </p>
                  </div>
                )}
              </>
            )}

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold">
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrorMessage(null);
                      }}
                      className="text-[10px] font-editorial-mono text-[var(--ink-muted)] hover:text-[var(--oxblood)] underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3 py-2 sm:py-1.5 font-editorial-sans text-base sm:text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/60 focus:border-[var(--oxblood)] focus:outline-hidden shadow-2xs disabled:opacity-50"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] py-2.5 sm:py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === "signin"
                      ? "Sign In to Studio"
                      : mode === "register"
                      ? "Create Author Account"
                      : "Send Recovery Link"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode Toggle Switcher (Hidden when success view is active) */}
        {!successMessage && (
          <div className="pt-2 border-t border-[var(--editorial-rule)] flex items-center justify-between font-editorial-mono text-[11px] text-[var(--ink-muted)]">
            {mode === "signin" ? (
              <>
                <span>New to INKFORGE?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErrorMessage(null);
                  }}
                  className="text-[var(--oxblood)] font-bold hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                <span>Already registered?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[var(--oxblood)] font-bold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        )}

        {/* Local-First Notice */}
        <div className="text-[10px] font-editorial-mono text-[var(--ink-muted)]/80 text-center leading-relaxed">
          <p>
            You can also write offline. All drafts are preserved local-first in your browser sanctuary.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, Feather, CheckCircle2, ArrowRight } from "lucide-react";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setEmail("");
    }, 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-md p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-warm)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Masthead */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--oxblood)] font-bold">
            <Feather className="h-3.5 w-3.5" />
            <span>Author Account &amp; Sign In</span>
          </div>
          <h2
            id="sign-in-modal-title"
            className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]"
          >
            Welcome to INKFORGE
          </h2>
          <p className="font-editorial-serif italic text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
            Sign in to sync your drafts across devices, manage published monographs, and bookmark favorite essays.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-lg bg-[var(--paper-warm)] border border-[var(--paper-border)] p-6 text-center space-y-2 animate-fade-in">
            <CheckCircle2 className="h-8 w-8 text-[var(--oxblood)] mx-auto" />
            <h3 className="font-editorial-serif text-lg font-bold text-[var(--ink-primary)]">
              Check Your Inbox
            </h3>
            <p className="font-editorial-sans text-xs text-[var(--ink-secondary)]">
              A secure magic sign-in link has been dispatched to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="author@independentpress.org"
                className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3.5 py-2 font-editorial-sans text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/60 focus:border-[var(--oxblood)] focus:outline-none shadow-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] shadow-xs transition-all"
            >
              <span>Continue with Magic Link</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        {/* Local-First Notice */}
        <div className="border-t border-[var(--editorial-rule)] pt-4 text-[11px] font-editorial-mono text-[var(--ink-muted)] text-center leading-relaxed">
          <p>
            You can also write and read without an account. All drafts save automatically to your local browser.
          </p>
        </div>
      </div>
    </div>
  );
}

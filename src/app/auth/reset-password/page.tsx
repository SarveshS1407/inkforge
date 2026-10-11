"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import {
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
} from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawToken = searchParams.get("token");
  const token = rawToken?.trim() || null;

  const [status, setStatus] = useState<"validating" | "form" | "success" | "error" | "prompt">(
    token ? "validating" : "prompt"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form inputs
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password request inputs (for error / prompt states)
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isRequestingLink, setIsRequestingLink] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"local" | "resend" | "simulated" | null>(null);

  // Validate token on mount if provided
  useEffect(() => {
    if (!token) return;
    const currentToken = token;

    let isMounted = true;

    async function checkToken() {
      try {
        const res = await fetch(`/api/v1/auth/reset-password?token=${encodeURIComponent(currentToken)}`, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setStatus("form");
        } else {
          setStatus("error");
          setErrorMessage(
            data.error?.message ||
              "This password reset link is invalid, has expired, or has already been used."
          );
        }
      } catch {
        if (isMounted) {
          setStatus("error");
          setErrorMessage("Network error while validating reset link. Please try again.");
        }
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Handle password reset submission
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !token) return;

    setErrorMessage(null);

    // Client-side validations
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters in length.");
      return;
    }
    if (newPassword.length > 128) {
      setErrorMessage("Password must not exceed 128 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("The two passwords entered do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setErrorMessage(data.error?.message || "Failed to update password.");
      }
    } catch {
      setErrorMessage("Network error while updating password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle requesting a fresh reset link
  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRequestingLink || !recoveryEmail.trim()) return;

    setIsRequestingLink(true);
    setRequestMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDeliveryMode(data.data?.delivery || null);
        setRequestMessage(
          data.data?.message ||
            "If an account exists with this email, a password reset link has been dispatched."
        );
      } else {
        setErrorMessage(data.error?.message || "Unable to dispatch recovery link.");
      }
    } catch {
      setErrorMessage("Network error. Please try again later.");
    } finally {
      setIsRequestingLink(false);
    }
  };

  const handleOpenSignIn = () => {
    window.dispatchEvent(new Event("inkforge_open_signin"));
  };

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-8 sm:p-10 shadow-paper text-center">
          {/* Header Icon Mark */}
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--paper-warm)] border border-[var(--paper-border)] shadow-xs">
            {status === "validating" && (
              <Loader2 className="h-6 w-6 text-[var(--oxblood)] animate-spin" />
            )}
            {status === "form" && (
              <KeyRound className="h-6 w-6 text-[var(--oxblood)]" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            )}
            {status === "error" && (
              <AlertCircle className="h-7 w-7 text-[var(--oxblood)]" />
            )}
            {status === "prompt" && (
              <Mail className="h-6 w-6 text-[var(--oxblood)]" />
            )}
          </div>

          {/* Running Editorial Tag */}
          <div className="mb-2 font-editorial-mono text-[10px] uppercase tracking-[0.25em] text-[var(--oxblood)] font-bold">
            INKFORGE • SECURITY ARCHIVE
          </div>

          {/* State 1: Validating Token Loading */}
          {status === "validating" && (
            <div className="space-y-3">
              <h1 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                Verifying Recovery Token
              </h1>
              <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] italic leading-relaxed">
                Authenticating single-use cryptographic token against the security registry...
              </p>
            </div>
          )}

          {/* State 2: Reset Form */}
          {status === "form" && (
            <div className="space-y-6 text-left">
              <div className="text-center space-y-1.5">
                <h1 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
                  Inscribe New Credentials
                </h1>
                <p className="font-editorial-serif text-xs sm:text-sm text-[var(--ink-secondary)] italic leading-relaxed">
                  Choose a robust password for your author sanctuary (minimum 8 characters).
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-lg bg-[var(--paper-warm)] border border-[var(--oxblood)]/40 p-3.5 flex items-start space-x-2.5 text-xs text-[var(--oxblood)] font-editorial-sans animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold">
                      New Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] font-editorial-mono text-[var(--ink-muted)] hover:text-[var(--ink-primary)] inline-flex items-center space-x-1"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      maxLength={128}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={isSubmitting}
                      className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3.5 py-2 font-editorial-sans text-xs sm:text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/60 focus:border-[var(--oxblood)] focus:outline-hidden shadow-2xs disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--oxblood)] font-bold mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3.5 py-2 font-editorial-sans text-xs sm:text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)]/60 focus:border-[var(--oxblood)] focus:outline-hidden shadow-2xs disabled:opacity-50"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--oxblood-hover)] shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Updating Credentials...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Update Password &amp; Secure Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="pt-3 border-t border-[var(--editorial-rule)] text-center">
                <p className="font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                  Updating your password will immediately revoke all active sessions across other devices.
                </p>
              </div>
            </div>
          )}

          {/* State 3: Success State */}
          {status === "success" && (
            <div className="space-y-6 animate-fade-in text-center">
              <h1 className="font-editorial-serif text-3xl font-bold text-[var(--ink-primary)]">
                Password Successfully Updated
              </h1>
              <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] leading-relaxed max-w-md mx-auto">
                Your new credentials have been permanently registered in the INKFORGE security ledger. All previous sessions across all browsers and devices have been revoked.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenSignIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] px-5 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Sign In with New Password</span>
                </button>

                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] px-5 py-2.5 font-editorial-sans text-xs font-semibold text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors"
                >
                  <span>Return to Frontispiece</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* State 4: Error State (Invalid / Expired Token) */}
          {status === "error" && (
            <div className="space-y-6 animate-fade-in text-center">
              <h1 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                Recovery Link Expired or Invalid
              </h1>
              <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] leading-relaxed max-w-md mx-auto">
                {errorMessage ||
                  "This single-use password recovery token has expired, has already been consumed, or is invalid."}
              </p>

              {/* Inline Recovery Request Form */}
              <div className="mt-6 pt-6 border-t border-[var(--editorial-rule)] text-left space-y-3">
                <p className="font-editorial-sans text-xs font-medium text-[var(--ink-primary)]">
                  Request a fresh password recovery link:
                </p>

                <form onSubmit={handleRequestLink} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email address"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    disabled={isRequestingLink}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3.5 py-2 text-xs font-editorial-sans text-[var(--ink-primary)] shadow-2xs focus:border-[var(--oxblood)] focus:outline-hidden disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={isRequestingLink}
                    className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isRequestingLink ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Dispatching Recovery Link...</span>
                      </>
                    ) : (
                      <span>Send New Recovery Link</span>
                    )}
                  </button>
                </form>

                {requestMessage && (
                  <div className="mt-2 space-y-1.5 text-left animate-fade-in">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-editorial-sans">
                      {requestMessage}
                    </p>
                    {deliveryMode === "local" && (
                      <p className="text-[11px] text-[var(--ink-secondary)] font-editorial-mono leading-relaxed bg-[var(--paper-warm)] p-2.5 rounded border border-[var(--paper-border)]">
                        <strong>Local Development Notice:</strong> Real email delivery is disabled because <code className="text-[var(--oxblood)]">RESEND_API_KEY</code> is not set in <code className="text-[var(--oxblood)]">.env</code>. The reset link was printed directly to your server terminal.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* State 5: Prompt State (Visited without token) */}
          {status === "prompt" && (
            <div className="space-y-6 text-center">
              <h1 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                Account Recovery &amp; Password Reset
              </h1>
              <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] leading-relaxed max-w-md mx-auto">
                Enter your registered author email below to receive a secure, single-use password recovery link.
              </p>

              <form onSubmit={handleRequestLink} className="space-y-3 text-left">
                <input
                  type="email"
                  required
                  placeholder="Enter your registered author email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  disabled={isRequestingLink}
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3.5 py-2 text-xs font-editorial-sans text-[var(--ink-primary)] shadow-2xs focus:border-[var(--oxblood)] focus:outline-hidden disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={isRequestingLink}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2.5 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isRequestingLink ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Dispatching Link...</span>
                    </>
                  ) : (
                    <span>Send Password Recovery Link</span>
                  )}
                </button>
              </form>

              {requestMessage && (
                <div className="mt-2 space-y-1.5 text-left animate-fade-in">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-editorial-sans">
                    {requestMessage}
                  </p>
                  {deliveryMode === "local" && (
                    <p className="text-[11px] text-[var(--ink-secondary)] font-editorial-mono leading-relaxed bg-[var(--paper-warm)] p-2.5 rounded border border-[var(--paper-border)]">
                      <strong>Local Development Notice:</strong> Real email delivery is disabled because <code className="text-[var(--oxblood)]">RESEND_API_KEY</code> is not set in <code className="text-[var(--oxblood)]">.env</code>. The reset link was printed directly to your server terminal.
                    </p>
                  )}
                </div>
              )}

              {errorMessage && (
                <p className="mt-2 text-xs text-[var(--oxblood)] font-editorial-sans text-left">
                  {errorMessage}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--paper-canvas)] flex items-center justify-center font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)]">
          Loading security archive...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

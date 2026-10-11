"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Mail,
  Loader2,
  Feather,
} from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "prompt">(
    token ? "loading" : "prompt"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"local" | "resend" | "simulated" | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function verify() {
      try {
        const res = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setStatus("success");
          window.dispatchEvent(new Event("inkforge_auth_change"));
        } else {
          setStatus("error");
          setErrorMessage(data.error?.message || "Invalid or expired verification token.");
        }
      } catch {
        if (isMounted) {
          setStatus("error");
          setErrorMessage("Network error while verifying email. Please try again.");
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setIsResending(true);
    setResendMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDeliveryMode(data.data?.delivery || null);
        setResendMessage(
          data.data?.message ||
            "If an unverified account exists with this email, a verification link has been processed."
        );
      } else {
        setErrorMessage(data.error?.message || "Failed to dispatch verification link.");
      }
    } catch {
      setErrorMessage("Network error. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-8 sm:p-10 shadow-paper text-center">
          {/* Header Mark */}
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--paper-warm)] border border-[var(--paper-border)] shadow-xs">
            {status === "loading" && (
              <Loader2 className="h-6 w-6 text-[var(--oxblood)] animate-spin" />
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

          {/* Running Imprint */}
          <div className="mb-2 font-editorial-mono text-[10px] uppercase tracking-[0.25em] text-[var(--oxblood)] font-bold">
            INKFORGE • AUTHOR VERIFICATION
          </div>

          {/* State 1: Verifying Loading State */}
          {status === "loading" && (
            <div className="space-y-3">
              <h1 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                Confirming Author Credentials
              </h1>
              <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] italic leading-relaxed">
                Verifying your cryptographic imprint against the permanent record...
              </p>
            </div>
          )}

          {/* State 2: Successful Verification */}
          {status === "success" && (
            <div className="space-y-5 animate-fade-in">
              <h1 className="font-editorial-serif text-3xl font-bold text-[var(--ink-primary)]">
                Author Account Verified
              </h1>
              <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] leading-relaxed">
                Your email address has been confirmed. Your author identity is permanently registered in the INKFORGE registry.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/write"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] px-5 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all"
                >
                  <Feather className="h-4 w-4" />
                  <span>Enter Writing Studio</span>
                </Link>

                <Link
                  href="/discover"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-md border border-[var(--paper-border)] bg-[var(--paper-warm)] px-5 py-2.5 font-editorial-sans text-xs font-semibold text-[var(--ink-primary)] hover:border-[var(--oxblood)] transition-colors"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* State 3: Token Invalid or Expired */}
          {status === "error" && (
            <div className="space-y-5 animate-fade-in">
              <h1 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                Verification Link Expired or Invalid
              </h1>
              <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] leading-relaxed">
                {errorMessage ||
                  "This single-use verification link has expired or has already been consumed."}
              </p>

              {/* Resend Form */}
              <div className="mt-6 pt-6 border-t border-[var(--editorial-rule)] text-left space-y-3">
                <p className="font-editorial-sans text-xs font-medium text-[var(--ink-primary)]">
                  Request a fresh verification link:
                </p>

                <form onSubmit={handleResend} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3.5 py-2 text-xs font-editorial-sans text-[var(--ink-primary)] shadow-2xs focus:border-[var(--oxblood)] focus:outline-hidden"
                  />

                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-colors disabled:opacity-50"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Dispatching Link...</span>
                      </>
                    ) : (
                      <span>Send New Verification Link</span>
                    )}
                  </button>
                </form>

                {resendMessage && (
                  <div className="mt-2 space-y-1.5 text-left">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-editorial-sans">
                      {resendMessage}
                    </p>
                    {deliveryMode === "local" && (
                      <p className="text-[11px] text-[var(--ink-secondary)] font-editorial-mono leading-relaxed bg-[var(--paper-warm)] p-2.5 rounded border border-[var(--paper-border)]">
                        <strong>Local Development Notice:</strong> Outbound email delivery is disabled because <code className="text-[var(--oxblood)]">RESEND_API_KEY</code> is not set in <code className="text-[var(--oxblood)]">.env</code>. The verification link was printed directly to your server terminal.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* State 4: Prompt to Enter Email if visited without token */}
          {status === "prompt" && (
            <div className="space-y-5">
              <h1 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
                Verify Your Author Account
              </h1>
              <p className="font-editorial-serif text-sm text-[var(--ink-secondary)] leading-relaxed">
                Enter your account email below to receive a single-use verification link.
              </p>

              <form onSubmit={handleResend} className="space-y-3 text-left">
                <input
                  type="email"
                  required
                  placeholder="Enter your registered email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-canvas)] px-3.5 py-2 text-xs font-editorial-sans text-[var(--ink-primary)] shadow-2xs focus:border-[var(--oxblood)] focus:outline-hidden"
                />

                <button
                  type="submit"
                  disabled={isResending}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-[var(--oxblood)] px-4 py-2.5 text-xs font-editorial-sans font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-colors disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Dispatching Link...</span>
                    </>
                  ) : (
                    <span>Send Verification Link</span>
                  )}
                </button>

                {resendMessage && (
                  <div className="mt-2 space-y-1.5 text-left">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-editorial-sans">
                      {resendMessage}
                    </p>
                    {deliveryMode === "local" && (
                      <p className="text-[11px] text-[var(--ink-secondary)] font-editorial-mono leading-relaxed bg-[var(--paper-warm)] p-2.5 rounded border border-[var(--paper-border)]">
                        <strong>Local Development Notice:</strong> Outbound email delivery is disabled because <code className="text-[var(--oxblood)]">RESEND_API_KEY</code> is not set in <code className="text-[var(--oxblood)]">.env</code>. The verification link was printed directly to your server terminal.
                      </p>
                    )}
                  </div>
                )}

                {errorMessage && (
                  <p className="mt-2 text-xs text-[var(--oxblood)] font-editorial-sans">
                    {errorMessage}
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--paper-canvas)] flex items-center justify-center font-editorial-mono text-xs uppercase tracking-widest text-[var(--oxblood)]">
          Loading verification sanctuary...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

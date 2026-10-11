"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/navigation/Header";
import {
  User,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Globe,
  MapPin,
  Save,
  Loader2,
  BookOpen,
} from "lucide-react";

interface ProfileFormData {
  displayName: string;
  username: string;
  bio: string;
  location: string;
  websiteUrl: string;
}

export default function AuthorProfileSettingsPage() {
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: "",
    username: "",
    bio: "",
    location: "",
    websiteUrl: "",
  });

  const [initialUsername, setInitialUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/v1/auth/me");
        if (!res.ok) {
          if (isMounted) setIsAuthenticated(false);
          return;
        }

        const json = await res.json();
        if (json.success && json.data) {
          if (isMounted) {
            setIsAuthenticated(true);
            const user = json.data;
            setInitialUsername(user.username);
            setFormData({
              displayName: user.displayName || user.username || "",
              username: user.username || "",
              bio: user.bio || user.profile?.bio || "",
              location: user.profile?.location || "",
              websiteUrl: user.profile?.websiteUrl || "",
            });
          }
        } else {
          if (isMounted) setIsAuthenticated(false);
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validation checks
    if (!formData.displayName.trim()) {
      setErrorMessage("Display name cannot be empty.");
      setIsSaving(false);
      return;
    }
    if (formData.displayName.length > 60) {
      setErrorMessage("Display name must be 60 characters or fewer.");
      setIsSaving(false);
      return;
    }

    const cleanUsername = formData.username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setErrorMessage("Username must be between 3 and 30 characters.");
      setIsSaving(false);
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      setErrorMessage("Username can only contain letters, numbers, hyphens, and underscores.");
      setIsSaving(false);
      return;
    }

    if (formData.bio.length > 500) {
      setErrorMessage("Biography must be 500 characters or fewer.");
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.displayName,
          username: cleanUsername,
          bio: formData.bio,
          location: formData.location,
          websiteUrl: formData.websiteUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error?.message || "Failed to update profile.");
        return;
      }

      setInitialUsername(cleanUsername);
      setSuccessMessage("Your author profile has been updated and synchronized with the registry!");
      window.dispatchEvent(new Event("inkforge_auth_change"));
    } catch {
      setErrorMessage("A network error occurred while updating your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper-canvas)] text-[var(--ink-primary)]">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center space-x-2 font-editorial-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
          <Link href="/" className="hover:text-[var(--oxblood)] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/posts" className="hover:text-[var(--oxblood)] transition-colors">
            Ledger
          </Link>
          <span>/</span>
          <span className="text-[var(--oxblood)] font-bold">Author Profile</span>
        </div>

        {/* Masthead */}
        <header className="border-b border-[var(--editorial-rule)] pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="font-editorial-mono text-xs font-bold uppercase tracking-widest text-[var(--oxblood)]">
              Identity &amp; Folio Registry
            </div>
            <h1 className="mt-1 font-editorial-serif text-3xl sm:text-4xl font-bold text-[var(--ink-primary)]">
              Author Profile &amp; Settings
            </h1>
            <p className="mt-1 font-editorial-serif italic text-sm text-[var(--ink-secondary)]">
              Manage your public author persona, biography, and canonical folio details.
            </p>
          </div>

          {isAuthenticated && initialUsername && (
            <Link
              href={`/authors/${initialUsername}`}
              className="inline-flex items-center space-x-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3.5 py-2 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-[var(--oxblood)] hover:border-[var(--oxblood)] transition-all shadow-2xs shrink-0"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>View Public Folio</span>
            </Link>
          )}
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--oxblood)]" />
            <p className="mt-3 font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
              Retrieving Author Record...
            </p>
          </div>
        )}

        {/* Unauthenticated State */}
        {!isLoading && !isAuthenticated && (
          <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-warm)] p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--paper-surface)] border border-[var(--paper-border)] text-[var(--oxblood)] mb-4">
              <User className="h-7 w-7" />
            </div>
            <h2 className="font-editorial-serif text-2xl font-bold text-[var(--ink-primary)]">
              Authentication Required
            </h2>
            <p className="mt-2 font-editorial-serif text-sm italic text-[var(--ink-secondary)] max-w-md mx-auto">
              Please sign in with your author credentials to access and edit your author folio.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("inkforge_open_signin"))}
                className="rounded-md bg-[var(--oxblood)] px-5 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all cursor-pointer"
              >
                Sign In to Your Account
              </button>
            </div>
          </div>
        )}

        {/* Authenticated Edit Form */}
        {!isLoading && isAuthenticated && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Banners */}
            {successMessage && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/40 p-4 text-xs text-red-800 dark:text-red-300 flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="book-jacket rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
              {/* Display Name */}
              <div>
                <label
                  htmlFor="displayName"
                  className="block font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-primary)] font-bold mb-1.5"
                >
                  Public Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  maxLength={60}
                  required
                  placeholder="e.g. Elena Rostova"
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3.5 py-2 font-editorial-serif text-base text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] transition-all"
                />
                <div className="mt-1 flex justify-between font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                  <span>How your name will appear on published monographs and bylines.</span>
                  <span>{formData.displayName.length} / 60</span>
                </div>
              </div>

              {/* Username Handle */}
              <div>
                <label
                  htmlFor="username"
                  className="block font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-primary)] font-bold mb-1.5"
                >
                  Author Handle (@username)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-editorial-mono text-sm text-[var(--ink-muted)]">
                    @
                  </span>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    minLength={3}
                    maxLength={30}
                    required
                    placeholder="elena_rostova"
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] pl-8 pr-3.5 py-2 font-editorial-mono text-sm text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] transition-all"
                  />
                </div>
                <div className="mt-1 flex justify-between font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                  <span>
                    Your canonical public folio link: <code className="text-[var(--oxblood)]">/authors/{formData.username || "handle"}</code>
                  </span>
                  <span>{formData.username.length} / 30</span>
                </div>
              </div>

              {/* Short Bio */}
              <div>
                <label
                  htmlFor="bio"
                  className="block font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-primary)] font-bold mb-1.5"
                >
                  Author Biography &amp; Scholarly Fellowship
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  maxLength={500}
                  placeholder="Share a brief overview of your writing pursuits, affiliations, and philosophical focus..."
                  className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3.5 py-2 font-editorial-serif text-sm leading-relaxed text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] transition-all resize-y"
                />
                <div className="mt-1 flex justify-between font-editorial-mono text-[10px] text-[var(--ink-muted)]">
                  <span>Displayed on your public author folio and publication cards.</span>
                  <span>{formData.bio.length} / 500</span>
                </div>
              </div>

              {/* Location & Website */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[var(--editorial-rule)]">
                <div>
                  <label
                    htmlFor="location"
                    className="flex items-center space-x-1.5 font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-primary)] font-bold mb-1.5"
                  >
                    <MapPin className="h-3 w-3 text-[var(--oxblood)]" />
                    <span>Location / Sanctuary</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="e.g. Oxford, UK"
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3.5 py-2 font-editorial-sans text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="websiteUrl"
                    className="flex items-center space-x-1.5 font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-primary)] font-bold mb-1.5"
                  >
                    <Globe className="h-3 w-3 text-[var(--oxblood)]" />
                    <span>Personal Website or Archive</span>
                  </label>
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    maxLength={300}
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] px-3.5 py-2 font-editorial-sans text-xs text-[var(--ink-primary)] focus:border-[var(--oxblood)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--oxblood)] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/posts"
                className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--oxblood)] transition-colors"
              >
                ← Return to Ledger
              </Link>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center space-x-2 rounded-md bg-[var(--oxblood)] px-6 py-2.5 font-editorial-sans text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--oxblood-hover)] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{isSaving ? "Synchronizing..." : "Inscribe & Save Profile"}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

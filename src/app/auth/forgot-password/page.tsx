import { redirect } from "next/navigation";

/**
 * Canonical redirect from legacy /auth/forgot-password to the unified
 * /auth/reset-password sanctuary, eliminating potential 404 (Folio Not Found) errors.
 */
export default function ForgotPasswordPage() {
  redirect("/auth/reset-password");
}

import { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, validateSession } from "./session";
import { UnauthorizedError, ForbiddenError } from "../errors";

/**
 * Checks whether a user role has authoring/writing privileges.
 * Supports modern "AUTHOR" and "TECH", as well as legacy "WRITER" and "ADMIN".
 */
export function canWrite(role?: string | null): boolean {
  if (!role) return false;
  const upper = role.toUpperCase();
  return upper === "AUTHOR" || upper === "WRITER" || upper === "ADMIN" || upper === "TECH";
}

/**
 * Checks whether a user role has platform tech administration privileges.
 */
export function canManageTech(role?: string | null): boolean {
  if (!role) return false;
  const upper = role.toUpperCase();
  return upper === "TECH" || upper === "ADMIN";
}

/**
 * Extracts session token from either:
 * 1. HTTP Cookie (Next.js web browser clients)
 * 2. Authorization: Bearer <token> header (Mobile apps / API clients)
 *
 * Explicitly rejects and ignores client-supplied x-user-id or identity headers.
 */
export function extractSessionToken(req: Request | NextRequest): string | null {
  // 1. Try NextRequest cookies API if available
  if ("cookies" in req && typeof req.cookies?.get === "function") {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME);
    if (cookie?.value) {
      return cookie.value;
    }
  }

  // 2. Parse raw Cookie header
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
    if (match) {
      return match.substring(SESSION_COOKIE_NAME.length + 1);
    }
  }

  // 3. Parse Authorization: Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Resolves the authenticated user from the request session, or returns null if unauthenticated.
 */
export async function getAuthenticatedUser(req: Request | NextRequest) {
  const token = extractSessionToken(req);
  if (!token) {
    return null;
  }

  const result = await validateSession(token);
  return result ? result.user : null;
}

/**
 * Enforces server-side authentication. Throws 401 UnauthorizedError if no valid session exists.
 */
export async function requireAuth(req: Request | NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    throw new UnauthorizedError("Authentication required. Please sign in to continue.");
  }
  return user;
}

/**
 * Enforces that the authenticated user possesses Author privileges.
 */
export async function requireAuthor(req: Request | NextRequest) {
  const user = await requireAuth(req);
  if (!canWrite(user.role)) {
    throw new ForbiddenError("Author privileges required to create or manage books.");
  }
  return user;
}

/**
 * Enforces that the authenticated user possesses Tech Administration privileges.
 */
export async function requireTech(req: Request | NextRequest) {
  const user = await requireAuth(req);
  if (!canManageTech(user.role)) {
    throw new ForbiddenError("Tech administration privileges required.");
  }
  return user;
}

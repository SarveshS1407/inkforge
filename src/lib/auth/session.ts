import { NextResponse } from "next/server";
import { prisma } from "../db";
import { generateSecureToken } from "./password";

export const SESSION_COOKIE_NAME = "inkforge_session";
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days

export interface SessionContext {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Creates a server-persisted database session and returns the secure token.
 */
export async function createSession(
  userId: string,
  context?: SessionContext
) {
  const sessionToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    },
    include: {
      user: {
        include: { profile: true },
      },
    },
  });

  return { sessionToken, session, user: session.user };
}

/**
 * Validates a session token from the database, ensuring it hasn't expired.
 * Implements sliding expiration if within 7 days of expiry.
 */
export async function validateSession(sessionToken: string) {
  if (!sessionToken || sessionToken.trim() === "") {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        include: { profile: true },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Check expiration
  if (session.expiresAt.getTime() < Date.now()) {
    // Session expired; delete lazily
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Sliding expiration: if less than 7 days left, extend by 30 days
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (session.expiresAt.getTime() - Date.now() < sevenDaysMs) {
    const nextExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: nextExpiresAt },
    }).catch(() => {});
  }

  return { user: session.user, session };
}

/**
 * Invalidate (delete) a specific session on logout.
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
  if (!sessionToken) return;

  await prisma.session.deleteMany({
    where: { sessionToken },
  });
}

/**
 * Invalidate all sessions for a user (e.g. on password reset or security revocation).
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  if (!userId) return;

  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Apply secure session cookie to HTTP response.
 */
export function setSessionCookie(
  response: NextResponse,
  sessionToken: string
): void {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
}

/**
 * Clear session cookie on HTTP response.
 */
export function clearSessionCookie(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

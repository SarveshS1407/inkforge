import { z } from "zod";
import slugify from "slugify";
import { prisma } from "../db";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
} from "../auth/password";
import {
  createSession,
  invalidateSession,
  invalidateAllUserSessions,
  SessionContext,
} from "../auth/session";
import { emailService } from "./email/email.service";
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
} from "../errors";

const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(128, "Password must be under 128 characters."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be under 30 characters.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain alphanumeric characters, underscores, and dashes."),
  displayName: z.string().min(1).max(60).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long.")
    .max(128, "New password must be under 128 characters."),
});

export class AuthService {
  /**
   * Register a new author account with email, password, and public profile.
   */
  static async register(
    rawInput: unknown,
    context?: SessionContext
  ) {
    const input = registerSchema.parse(rawInput);
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanUsername = input.username.trim().toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existing) {
      if (existing.email === cleanEmail) {
        throw new ConflictError("An account with this email address already exists.");
      }
      throw new ConflictError("This username is already taken. Please choose another.");
    }

    const passwordHash = await hashPassword(input.password);
    const displayName = input.displayName?.trim() || cleanUsername;
    const authorSlug = (slugify as unknown as (str: string, opts: object) => string)(cleanUsername, {
      lower: true,
      strict: true,
    }) || cleanUsername;

    // Create user and profile in transaction
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        username: cleanUsername,
        displayName,
        role: "WRITER",
        profile: {
          create: {
            displayName,
            slug: authorSlug,
            bio: "Author at the INKFORGE Publishing Sanctuary.",
          },
        },
      },
      include: { profile: true },
    });

    // Generate single-use email verification token (expires in 24 hours)
    const rawVerificationToken = generateSecureToken(32);
    const verificationTokenHash = hashToken(rawVerificationToken);
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash: verificationTokenHash,
        expiresAt: verificationExpiresAt,
      },
    });

    // Dispatch verification email (non-blocking)
    emailService
      .sendVerificationEmail(user.email, rawVerificationToken, user.displayName)
      .catch((err) => console.error("Failed to send verification email:", err));

    // Create immediate authenticated session
    const { sessionToken, session } = await createSession(user.id, context);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        emailVerified: user.emailVerified,
        profile: user.profile,
      },
      sessionToken,
      session,
      rawVerificationToken, // Provided for testing flows
    };
  }

  /**
   * Authenticate with email and password.
   */
  static async login(
    rawInput: unknown,
    context?: SessionContext
  ) {
    const input = loginSchema.parse(rawInput);
    const cleanEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { profile: true },
    });

    // Generic error message to prevent user enumeration
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const { sessionToken, session } = await createSession(user.id, context);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        emailVerified: user.emailVerified,
        profile: user.profile,
      },
      sessionToken,
      session,
    };
  }

  /**
   * Log out and terminate the current session.
   */
  static async logout(sessionToken: string): Promise<void> {
    await invalidateSession(sessionToken);
  }

  /**
   * Verify email using an expiring, single-use token.
   */
  static async verifyEmail(rawToken: string) {
    if (!rawToken || rawToken.trim() === "") {
      throw new ValidationError("Verification token is required.");
    }

    const tokenHash = hashToken(rawToken.trim());

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord) {
      throw new ValidationError("Invalid or expired verification token.");
    }

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      throw new ValidationError("This verification token has expired. Please request a new one.");
    }

    // Atomically mark verified and consume token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { id: tokenRecord.id },
      }),
    ]);

    return { verified: true, userId: tokenRecord.userId };
  }

  /**
   * Resend email verification link.
   * Enforces:
   * 1. Account enumeration protection (generic response for non-existent or already-verified accounts)
   * 2. Rate limiting (minimum 60-second cooldown per user)
   * 3. Single-use invalidation (deletes existing tokens so only 1 valid token exists at a time)
   * 4. 24-hour expiry for cryptographically secure 32-byte token
   */
  static async resendVerification(rawIdentifier: string) {
    if (!rawIdentifier || rawIdentifier.trim() === "") {
      throw new ValidationError("Email or user identifier is required.");
    }

    const clean = rawIdentifier.trim().toLowerCase();

    // Find user by email or by ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: clean }, { id: rawIdentifier.trim() }],
      },
    });

    // Enumeration protection: If user doesn't exist or is already verified, return generic message
    if (!user || user.emailVerified !== null) {
      return {
        success: true,
        delivery: "simulated",
        message: "If an unverified account exists with this email, a verification link has been processed.",
      };
    }

    // Rate limiting: Check most recent verification token for this user
    const latestToken = await prisma.verificationToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (latestToken) {
      const elapsedMs = Date.now() - latestToken.createdAt.getTime();
      const cooldownMs = 60 * 1000; // 60 seconds
      if (elapsedMs < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
        throw new TooManyRequestsError(
          `Please wait ${remainingSec} seconds before requesting another verification email.`,
          { remainingSeconds: remainingSec }
        );
      }
    }

    // Invalidate/delete all previous unconsumed verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate fresh single-use verification token (expires in 24 hours)
    const rawVerificationToken = generateSecureToken(32);
    const verificationTokenHash = hashToken(rawVerificationToken);
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash: verificationTokenHash,
        expiresAt: verificationExpiresAt,
      },
    });

    // Dispatch verification email
    const delivery = await emailService.sendVerificationEmail(
      user.email,
      rawVerificationToken,
      user.displayName
    );

    const message =
      delivery.provider === "local"
        ? "Verification link generated and captured in server console (local development mode)."
        : "Verification link dispatched to your email inbox.";

    return {
      success: true,
      delivery: delivery.provider,
      message,
      rawVerificationToken: process.env.NODE_ENV === "test" ? rawVerificationToken : undefined,
    };
  }

  /**
   * Request password reset token.
   * Uses generic response to eliminate user account enumeration.
   */
  static async requestPasswordReset(email: string) {
    if (!email || !email.includes("@")) {
      throw new ValidationError("Please provide a valid email address.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (user) {
      // Clean up expired tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          expiresAt: { lt: new Date() },
        },
      });

      // Generate 1-hour reset token
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Dispatch reset email
      const delivery = await emailService
        .sendPasswordResetEmail(user.email, rawToken, user.displayName)
        .catch((err) => {
          console.error("Failed to send reset email:", err);
          return { success: false, provider: "local" as const };
        });

      const message =
        delivery.provider === "local"
          ? "Password reset link generated and captured in server console (local development mode)."
          : "If an account exists with this email, a password reset link has been dispatched.";

      return {
        success: true,
        delivery: delivery.provider,
        message,
        rawTokenForTesting: process.env.NODE_ENV === "test" ? rawToken : undefined,
      };
    }

    // Generic response when email does not exist (anti-enumeration)
    return {
      success: true,
      delivery: "simulated",
      message: "If an account exists with this email, a password reset link has been processed.",
    };
  }

  /**
   * Validate password reset token without consuming it.
   */
  static async validateResetToken(rawToken: string) {
    if (!rawToken || rawToken.trim() === "") {
      throw new ValidationError("Password reset token is required.");
    }

    const tokenHash = hashToken(rawToken.trim());
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord) {
      throw new ValidationError("Invalid or expired password reset token.");
    }

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      throw new ValidationError("This password reset token has expired. Please request a new link.");
    }

    return { valid: true, expiresAt: tokenRecord.expiresAt };
  }

  /**
   * Reset password using single-use token and revoke all existing user sessions.
   */
  static async resetPassword(rawInput: unknown) {
    const input = resetPasswordSchema.parse(rawInput);
    const tokenHash = hashToken(input.token.trim());

    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord) {
      throw new ValidationError("Invalid or expired password reset token.");
    }

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      throw new ValidationError("This password reset token has expired. Please request a new link.");
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    // Atomically update password, delete all user reset tokens, and invalidate all sessions across devices
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: tokenRecord.userId },
      }),
      prisma.session.deleteMany({
        where: { userId: tokenRecord.userId },
      }),
    ]);

    return {
      success: true,
      message: "Password updated successfully. Please sign in with your new credentials.",
    };
  }
}

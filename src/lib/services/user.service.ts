import { prisma } from "../db";
import { NotFoundError, ValidationError, ConflictError } from "../errors";
import { UpdateProfileInput, PublicAuthorResponse } from "@/types/api";
import { sanitizeUrl } from "../sanitizer";

export class UserService {
  /**
   * Validates and normalizes an author username.
   */
  static validateAndNormalizeUsername(rawUsername: string): string {
    const trimmed = rawUsername.trim();
    if (trimmed.length < 3) {
      throw new ValidationError("Username must be at least 3 characters long.");
    }
    if (trimmed.length > 30) {
      throw new ValidationError("Username must be 30 characters or fewer.");
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      throw new ValidationError(
        "Username can only contain alphanumeric characters, underscores, and dashes."
      );
    }
    return trimmed.toLowerCase();
  }

  /**
   * Retrieves an author profile by ID (authenticated author view).
   */
  static async getAuthorProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundError(`Author with ID '${userId}' not found.`);
    }

    // Exclude passwordHash and return safe account payload
    const { passwordHash: _hash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Updates permitted author profile fields with server-side validation and ownership enforcement.
   */
  static async updateAuthorProfile(userId: string, input: UpdateProfileInput) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!existing) {
      throw new NotFoundError(`Author with ID '${userId}' not found.`);
    }

    const updates: {
      displayName?: string;
      username?: string;
      bio?: string | null;
      avatarUrl?: string | null;
    } = {};

    const profileUpdates: {
      displayName?: string;
      slug?: string;
      bio?: string | null;
      avatarUrl?: string | null;
      websiteUrl?: string | null;
      location?: string | null;
    } = {};

    // 1. Display Name
    if (input.displayName !== undefined) {
      const cleanName = input.displayName.trim();
      if (cleanName.length < 1) {
        throw new ValidationError("Display name cannot be empty.");
      }
      if (cleanName.length > 60) {
        throw new ValidationError("Display name must be 60 characters or fewer.");
      }
      updates.displayName = cleanName;
      profileUpdates.displayName = cleanName;
    }

    // 2. Username
    if (input.username !== undefined) {
      const cleanUsername = this.validateAndNormalizeUsername(input.username);
      if (cleanUsername !== existing.username) {
        // Enforce uniqueness against collisions
        const conflict = await prisma.user.findFirst({
          where: {
            username: cleanUsername,
            NOT: { id: userId },
          },
        });
        if (conflict) {
          throw new ConflictError("This username is already taken. Please choose another.");
        }
        updates.username = cleanUsername;
        profileUpdates.slug = cleanUsername;
      }
    }

    // 3. Biography
    if (input.bio !== undefined) {
      const cleanBio = input.bio.trim();
      if (cleanBio.length > 500) {
        throw new ValidationError("Biography must be 500 characters or fewer.");
      }
      updates.bio = cleanBio || null;
      profileUpdates.bio = cleanBio || null;
    }

    // 4. Website URL
    if (input.websiteUrl !== undefined) {
      const trimmedUrl = input.websiteUrl.trim();
      if (trimmedUrl.length > 300) {
        throw new ValidationError("Website URL must be 300 characters or fewer.");
      }
      const cleanUrl = trimmedUrl ? sanitizeUrl(trimmedUrl) : null;
      profileUpdates.websiteUrl = cleanUrl === "#" ? null : cleanUrl;
    }

    // 5. Location
    if (input.location !== undefined) {
      const cleanLocation = input.location.trim();
      if (cleanLocation.length > 100) {
        throw new ValidationError("Location must be 100 characters or fewer.");
      }
      profileUpdates.location = cleanLocation || null;
    }

    // 6. Avatar URL
    if (input.avatarUrl !== undefined) {
      const trimmedAvatar = input.avatarUrl.trim();
      if (trimmedAvatar.length > 300) {
        throw new ValidationError("Avatar URL must be 300 characters or fewer.");
      }
      const cleanAvatar = trimmedAvatar ? sanitizeUrl(trimmedAvatar) : null;
      updates.avatarUrl = cleanAvatar === "#" ? null : cleanAvatar;
      profileUpdates.avatarUrl = cleanAvatar === "#" ? null : cleanAvatar;
    }

    // Execute atomic update across User and Profile
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: updates,
      });

      const profile = await tx.profile.upsert({
        where: { userId },
        update: profileUpdates,
        create: {
          userId,
          displayName: updates.displayName || existing.displayName || existing.username,
          slug: updates.username || existing.username,
          bio: profileUpdates.bio !== undefined ? profileUpdates.bio : existing.bio,
          avatarUrl: profileUpdates.avatarUrl !== undefined ? profileUpdates.avatarUrl : existing.avatarUrl,
          websiteUrl: profileUpdates.websiteUrl || null,
          location: profileUpdates.location || null,
        },
      });

      return { ...user, profile };
    });

    const { passwordHash: _hash, ...safeUpdated } = updatedUser;
    return safeUpdated;
  }

  /**
   * Retrieves public author profile and their published monographs by username handle.
   * Strictly filters out drafts, unpublished works, emails, passwords, and private tokens.
   */
  static async getPublicAuthorByUsername(username: string): Promise<PublicAuthorResponse> {
    const cleanUsername = username.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username: cleanUsername },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            websiteUrl: true,
            location: true,
            bio: true,
            displayName: true,
          },
        },
        posts: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          select: {
            id: true,
            title: true,
            subtitle: true,
            slug: true,
            excerpt: true,
            readingTimeMinutes: true,
            publishedAt: true,
            canonicalUrl: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError(`Author with handle '@${username}' not found in the INKFORGE registry.`);
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.profile?.displayName || user.username,
      bio: user.bio || user.profile?.bio || null,
      avatarUrl: user.avatarUrl || null,
      role: user.role,
      createdAt: user.createdAt,
      websiteUrl: user.profile?.websiteUrl || null,
      location: user.profile?.location || null,
      posts: user.posts,
    };
  }

  /**
   * Lists public authors who have published monographs in INKFORGE.
   */
  static async listPublicAuthors(limit = 20) {
    const authors = await prisma.user.findMany({
      where: {
        posts: {
          some: { status: "PUBLISHED" },
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            posts: {
              where: { status: "PUBLISHED" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
    });

    return authors.map((a) => ({
      id: a.id,
      username: a.username,
      displayName: a.displayName || a.username,
      bio: a.bio,
      avatarUrl: a.avatarUrl,
      role: a.role,
      createdAt: a.createdAt,
      publishedCount: a._count.posts,
    }));
  }
}

// Retain legacy exports for backwards compatibility
export async function getOrCreateDefaultUser() {
  const defaultEmail = "author@inkforge.local";
  const defaultUsername = "resident-author";

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ email: defaultEmail }, { username: defaultUsername }],
    },
    include: { profile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: defaultEmail,
        username: defaultUsername,
        displayName: "Resident Author",
        role: "WRITER",
        bio: "Writing fellow and essayist at the Inkforge Publishing Sanctuary.",
        profile: {
          create: {
            displayName: "Resident Author",
            slug: "resident-author",
            bio: "Writing fellow and essayist at the Inkforge Publishing Sanctuary.",
          },
        },
      },
      include: { profile: true },
    });
  }

  return user;
}

export async function getUserById(id: string) {
  return await UserService.getAuthorProfile(id);
}

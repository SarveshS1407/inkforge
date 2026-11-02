import slugify from "slugify";
import { prisma } from "../db";
import { canWrite, canManageTech } from "../auth/guard";
import { ImportService } from "./import.service";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../errors";

export interface CreateBookInput {
  title: string;
  subtitle?: string;
  description?: string;
  genre?: string;
  mood?: string;
  coverTheme?: string;
  coverTitle?: string;
  coverSubtitle?: string;
  coverAuthor?: string;
  coverEmblem?: string;
  visibility?: "PRIVATE" | "PUBLIC";
  sourceFilename?: string;
  importMethod?: "DIRECT" | "PASTE" | "DOCX" | "PDF";
  importWarnings?: string[];
  formattingOptions?: string;
  originalFileSize?: number;
  originalFileStoragePath?: string;
  stagedFileKey?: string;
  chapters?: Array<{
    title: string;
    subtitle?: string;
    contentHtml?: string;
    contentJson?: string;
    targetWords?: number;
    orderIndex?: number;
  }>;
}

export interface UpdateBookInput {
  title?: string;
  subtitle?: string;
  description?: string;
  genre?: string;
  mood?: string;
  coverTheme?: string;
  coverTitle?: string;
  coverSubtitle?: string;
  coverAuthor?: string;
  coverEmblem?: string;
  visibility?: "PRIVATE" | "PUBLIC";
}

export class BookService {
  /**
   * Generates a collision-resistant unique slug for a book.
   */
  private static async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = (slugify as unknown as (str: string, opts: object) => string)(title, {
      lower: true,
      strict: true,
    }) || "untitled-book";

    let slug = baseSlug;
    let counter = 1;

    while (await prisma.book.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Generates a collision-resistant unique slug for a chapter/post.
   */
  private static async generateChapterSlug(bookSlug: string, chapterTitle: string): Promise<string> {
    const titleSlug = (slugify as unknown as (str: string, opts: object) => string)(chapterTitle, {
      lower: true,
      strict: true,
    }) || "chapter";

    const baseSlug = `${bookSlug}-${titleSlug}`;
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Creates a new Book with optional initial chapters, activity log, and revision snapshot.
   */
  static async createBook(userId: string, input: CreateBookInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !canWrite(user.role)) {
      throw new ForbiddenError("Author privileges required to create books.");
    }

    const cleanTitle = input.title?.trim();
    if (!cleanTitle) {
      throw new ValidationError("Book title is required.");
    }

    const slug = await this.generateUniqueSlug(cleanTitle);
    const visibility = input.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE";

    // Create book and initial chapters
    const book = await prisma.book.create({
      data: {
        title: cleanTitle,
        subtitle: input.subtitle?.trim() || null,
        slug,
        description: input.description?.trim() || null,
        genre: input.genre || null,
        mood: input.mood || null,
        coverTheme: input.coverTheme || "obsidian",
        coverTitle: input.coverTitle || cleanTitle,
        coverSubtitle: input.coverSubtitle || input.subtitle || null,
        coverAuthor: input.coverAuthor || user.displayName || user.username,
        coverEmblem: input.coverEmblem || "feather",
        status: visibility === "PUBLIC" ? "PUBLISHED" : "DRAFT",
        visibility,
        sourceFilename: input.sourceFilename || null,
        importMethod: input.importMethod || "DIRECT",
        importWarnings: input.importWarnings ? JSON.stringify(input.importWarnings) : null,
        formattingOptions: input.formattingOptions || null,
        originalFileSize: input.originalFileSize || null,
        originalFileStoragePath: input.originalFileStoragePath || null,
        publishedAt: visibility === "PUBLIC" ? new Date() : null,
        authorId: userId,
      },
    });

    // Commit staged manuscript file if provided
    if (input.stagedFileKey) {
      const commitRes = await ImportService.commitStagedFile(input.stagedFileKey, book.id);
      if (commitRes) {
        await prisma.book.update({
          where: { id: book.id },
          data: {
            originalFileStoragePath: commitRes.storagePath,
            originalFileSize: commitRes.fileSize,
          },
        });
      }
    }

    // Create chapters if provided
    let totalWords = 0;
    const createdChapters = [];
    if (input.chapters && input.chapters.length > 0) {
      for (let i = 0; i < input.chapters.length; i++) {
        const ch = input.chapters[i];
        const chTitle = ch.title?.trim() || `Chapter ${i + 1}`;
        const chSlug = await this.generateChapterSlug(slug, chTitle);
        const orderIndex = ch.orderIndex !== undefined ? ch.orderIndex : i + 1;
        
        // Count words
        const plain = (ch.contentHtml || "").replace(/<[^>]+>/g, " ").trim();
        const chWords = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
        totalWords += chWords;

        const post = await prisma.post.create({
          data: {
            title: chTitle,
            subtitle: ch.subtitle || null,
            slug: chSlug,
            contentHtml: ch.contentHtml || "<p></p>",
            contentJson: ch.contentJson || null,
            targetWords: ch.targetWords || 1200,
            status: visibility === "PUBLIC" ? "PUBLISHED" : "DRAFT",
            publishedAt: visibility === "PUBLIC" ? new Date() : null,
            authorId: userId,
            bookId: book.id,
            orderIndex,
          },
        });
        createdChapters.push(post);
      }
    }

    // Log Activity
    const activityDesc = input.importMethod && input.importMethod !== "DIRECT"
      ? `Imported book "${cleanTitle}" via ${input.importMethod} (${createdChapters.length} chapters, ${totalWords} words)`
      : `Created new book "${cleanTitle}"`;

    await prisma.bookActivity.create({
      data: {
        bookId: book.id,
        userId,
        action: input.importMethod && input.importMethod !== "DIRECT" ? "IMPORTED" : "CREATED",
        description: activityDesc,
        metadataJson: JSON.stringify({
          sourceFilename: input.sourceFilename,
          chapterCount: createdChapters.length,
          totalWords,
          importMethod: input.importMethod,
        }),
      },
    });

    // Create Revision Snapshot (Version 1)
    await this.createRevisionSnapshot(book.id, 1, `Initial version (${cleanTitle})`);

    return this.getById(book.id, userId);
  }

  /**
   * Retrieves a single Book by ID, strictly enforcing visibility rules.
   */
  static async getById(bookId: string, requestingUserId?: string | null) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            profile: true,
          },
        },
        chapters: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            title: true,
            subtitle: true,
            slug: true,
            excerpt: true,
            orderIndex: true,
            status: true,
            readingTimeMinutes: true,
            contentHtml: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!book) {
      throw new NotFoundError("Book not found.");
    }

    // Check visibility permissions
    if (book.visibility === "PRIVATE") {
      const isOwner = requestingUserId && requestingUserId === book.authorId;
      let isAdmin = false;
      if (requestingUserId) {
        const reqUser = await prisma.user.findUnique({ where: { id: requestingUserId } });
        isAdmin = canManageTech(reqUser?.role);
      }

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError("This manuscript is private and only accessible by the author.");
      }
    }

    return book;
  }

  /**
   * Retrieves a single Book by slug, strictly enforcing visibility rules.
   */
  static async getBySlug(slug: string, requestingUserId?: string | null) {
    const book = await prisma.book.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            profile: true,
          },
        },
        chapters: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            title: true,
            subtitle: true,
            slug: true,
            excerpt: true,
            orderIndex: true,
            status: true,
            readingTimeMinutes: true,
            contentHtml: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundError("Book not found.");
    }

    if (book.visibility === "PRIVATE") {
      const isOwner = requestingUserId && requestingUserId === book.authorId;
      let isAdmin = false;
      if (requestingUserId) {
        const reqUser = await prisma.user.findUnique({ where: { id: requestingUserId } });
        isAdmin = canManageTech(reqUser?.role);
      }

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError("This manuscript is private and only accessible by the author.");
      }
    }

    return book;
  }

  /**
   * Lists books with pagination and filtering.
   * Public requests only return PUBLIC published books.
   */
  static async listBooks(params: {
    requestingUserId?: string | null;
    authorId?: string;
    visibility?: "PRIVATE" | "PUBLIC" | "ALL";
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      requestingUserId,
      authorId,
      visibility,
      search,
      page = 1,
      limit = 20,
    } = params;

    const skip = (Math.max(1, page) - 1) * limit;

    // Build WHERE clause
    const where: Record<string, unknown> = {};

    if (authorId) {
      where.authorId = authorId;
    }

    // Privacy rules
    const isOwner = requestingUserId && authorId && requestingUserId === authorId;
    
    if (visibility === "PRIVATE") {
      if (!isOwner && requestingUserId) {
        const reqUser = await prisma.user.findUnique({ where: { id: requestingUserId } });
        if (!canManageTech(reqUser?.role)) {
          throw new ForbiddenError("You may only view your own private drafts.");
        }
      }
      where.visibility = "PRIVATE";
      if (!authorId && requestingUserId) {
        where.authorId = requestingUserId;
      }
    } else if (visibility === "PUBLIC") {
      where.visibility = "PUBLIC";
      where.status = "PUBLISHED";
    } else {
      // ALL: If owner, allow seeing both. If public, enforce PUBLIC only.
      if (!isOwner) {
        where.visibility = "PUBLIC";
        where.status = "PUBLISHED";
      }
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              profile: true,
            },
          },
          _count: {
            select: { chapters: true },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Updates a Book's metadata, cover customization, or visibility.
   */
  static async updateBook(bookId: string, userId: string, input: UpdateBookInput) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundError("Book not found.");
    }

    if (book.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!canManageTech(user?.role)) {
        throw new ForbiddenError("You do not have permission to modify this book.");
      }
    }

    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.subtitle !== undefined) updateData.subtitle = input.subtitle ? input.subtitle.trim() : null;
    if (input.description !== undefined) updateData.description = input.description ? input.description.trim() : null;
    if (input.genre !== undefined) updateData.genre = input.genre;
    if (input.mood !== undefined) updateData.mood = input.mood;
    if (input.coverTheme !== undefined) updateData.coverTheme = input.coverTheme;
    if (input.coverTitle !== undefined) updateData.coverTitle = input.coverTitle;
    if (input.coverSubtitle !== undefined) updateData.coverSubtitle = input.coverSubtitle;
    if (input.coverAuthor !== undefined) updateData.coverAuthor = input.coverAuthor;
    if (input.coverEmblem !== undefined) updateData.coverEmblem = input.coverEmblem;

    // Check visibility change
    const isVisibilityChanged = input.visibility !== undefined && input.visibility !== book.visibility;
    if (input.visibility !== undefined) {
      updateData.visibility = input.visibility;
      if (input.visibility === "PUBLIC") {
        updateData.status = "PUBLISHED";
        updateData.publishedAt = book.publishedAt || new Date();
      } else {
        updateData.status = "DRAFT";
      }
    }

    const updated = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
    });

    // Log Activity
    const action = isVisibilityChanged ? "VISIBILITY_CHANGED" : "METADATA_UPDATED";
    const desc = isVisibilityChanged
      ? `Visibility changed to ${input.visibility === "PUBLIC" ? "Published (Public)" : "Private (Only Me)"}`
      : `Updated book details (${Object.keys(updateData).join(", ")})`;

    await prisma.bookActivity.create({
      data: {
        bookId,
        userId,
        action,
        description: desc,
        metadataJson: JSON.stringify(updateData),
      },
    });

    return updated;
  }

  /**
   * Sets book status to PUBLISHED and visibility to PUBLIC.
   */
  static async publishBook(bookId: string, userId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { chapters: true },
    });
    if (!book) throw new NotFoundError("Book not found.");

    if (book.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!canManageTech(user?.role)) {
        throw new ForbiddenError("Permission denied.");
      }
    }

    const publishedAt = new Date();

    // Atomically publish book and chapters
    await prisma.$transaction([
      prisma.book.update({
        where: { id: bookId },
        data: {
          status: "PUBLISHED",
          visibility: "PUBLIC",
          publishedAt,
        },
      }),
      prisma.post.updateMany({
        where: { bookId },
        data: {
          status: "PUBLISHED",
          publishedAt,
        },
      }),
      prisma.bookActivity.create({
        data: {
          bookId,
          userId,
          action: "PUBLISHED",
          description: `Published book to the sanctuary reader (${book.chapters.length} chapters)`,
          metadataJson: JSON.stringify({ publishedAt }),
        },
      }),
    ]);

    // Create a new snapshot
    const nextVersion = await this.getNextRevisionVersion(bookId);
    await this.createRevisionSnapshot(bookId, nextVersion, "Published snapshot");

    return this.getById(bookId, userId);
  }

  /**
   * Sets book status to DRAFT and visibility to PRIVATE.
   */
  static async unpublishBook(bookId: string, userId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError("Book not found.");

    if (book.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!canManageTech(user?.role)) {
        throw new ForbiddenError("Permission denied.");
      }
    }

    await prisma.$transaction([
      prisma.book.update({
        where: { id: bookId },
        data: {
          status: "DRAFT",
          visibility: "PRIVATE",
        },
      }),
      prisma.post.updateMany({
        where: { bookId },
        data: { status: "DRAFT" },
      }),
      prisma.bookActivity.create({
        data: {
          bookId,
          userId,
          action: "UNPUBLISHED",
          description: "Unpublished book to Private (Only Me)",
        },
      }),
    ]);

    return this.getById(bookId, userId);
  }

  /**
   * Adds a new chapter to an existing book.
   */
  static async addChapter(bookId: string, userId: string, data: {
    title: string;
    subtitle?: string;
    contentHtml?: string;
    contentJson?: string;
  }) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { chapters: { orderBy: { orderIndex: "desc" }, take: 1 } },
    });
    if (!book) throw new NotFoundError("Book not found.");

    if (book.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!canManageTech(user?.role)) {
        throw new ForbiddenError("Permission denied.");
      }
    }

    const nextOrder = (book.chapters[0]?.orderIndex ?? 0) + 1;
    const cleanTitle = data.title?.trim() || `Chapter ${nextOrder}`;
    const slug = await this.generateChapterSlug(book.slug, cleanTitle);

    const post = await prisma.post.create({
      data: {
        title: cleanTitle,
        subtitle: data.subtitle || null,
        slug,
        contentHtml: data.contentHtml || "<p></p>",
        contentJson: data.contentJson || null,
        bookId,
        authorId: userId,
        orderIndex: nextOrder,
        status: book.status,
      },
    });

    await prisma.bookActivity.create({
      data: {
        bookId,
        userId,
        action: "CHAPTER_ADDED",
        description: `Added "${cleanTitle}" (Chapter ${nextOrder})`,
      },
    });

    return post;
  }

  /**
   * Reorders chapters in a book.
   */
  static async reorderChapters(bookId: string, userId: string, chapterOrders: Array<{ id: string; orderIndex: number }>) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError("Book not found.");

    if (book.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!canManageTech(user?.role)) {
        throw new ForbiddenError("Permission denied.");
      }
    }

    await prisma.$transaction(
      chapterOrders.map((item) =>
        prisma.post.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    await prisma.bookActivity.create({
      data: {
        bookId,
        userId,
        action: "CHAPTER_REORDERED",
        description: `Reordered ${chapterOrders.length} chapters`,
      },
    });

    return this.getById(bookId, userId);
  }

  /**
   * Deletes a Book and its cascade associations.
   */
  static async deleteBook(bookId: string, userId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError("Book not found.");

    if (book.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!canManageTech(user?.role)) {
        throw new ForbiddenError("Permission denied.");
      }
    }

    await prisma.book.delete({ where: { id: bookId } });
    return { success: true };
  }

  /**
   * Fetches full history: chronological activities and versioned revision snapshots.
   */
  static async getHistory(bookId: string, userId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError("Book not found.");

    if (book.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!canManageTech(user?.role)) {
        throw new ForbiddenError("Permission denied.");
      }
    }

    const [activities, revisions] = await Promise.all([
      prisma.bookActivity.findMany({
        where: { bookId },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.bookRevision.findMany({
        where: { bookId },
        orderBy: { version: "desc" },
      }),
    ]);

    return { activities, revisions };
  }

  /**
   * Restores a whole-book snapshot from a previous revision.
   */
  static async restoreRevision(bookId: string, version: number, userId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError("Book not found.");

    if (book.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!canManageTech(user?.role)) {
        throw new ForbiddenError("Permission denied.");
      }
    }

    const revision = await prisma.bookRevision.findFirst({
      where: { bookId, version },
    });
    if (!revision) {
      throw new NotFoundError(`Revision version ${version} not found.`);
    }

    const snapshot = JSON.parse(revision.snapshotJson);

    // Restore book fields
    await prisma.book.update({
      where: { id: bookId },
      data: {
        title: snapshot.title,
        subtitle: snapshot.subtitle,
        description: snapshot.description,
        coverTheme: snapshot.coverTheme,
        coverTitle: snapshot.coverTitle,
        coverAuthor: snapshot.coverAuthor,
        visibility: snapshot.visibility,
      },
    });

    // Delete current chapters and recreate from snapshot
    if (snapshot.chapters && Array.isArray(snapshot.chapters)) {
      await prisma.post.deleteMany({ where: { bookId } });
      for (const ch of snapshot.chapters) {
        const slug = await this.generateChapterSlug(book.slug, ch.title);
        await prisma.post.create({
          data: {
            title: ch.title,
            subtitle: ch.subtitle,
            slug,
            contentHtml: ch.contentHtml || "<p></p>",
            contentJson: ch.contentJson || null,
            orderIndex: ch.orderIndex,
            bookId,
            authorId: userId,
            status: book.status,
          },
        });
      }
    }

    await prisma.bookActivity.create({
      data: {
        bookId,
        userId,
        action: "REVISION_RESTORED",
        description: `Restored book to Version ${version} ("${revision.title}")`,
      },
    });

    return this.getById(bookId, userId);
  }

  /**
   * Helper: calculates next integer revision version.
   */
  private static async getNextRevisionVersion(bookId: string): Promise<number> {
    const latest = await prisma.bookRevision.findFirst({
      where: { bookId },
      orderBy: { version: "desc" },
    });
    return (latest?.version ?? 0) + 1;
  }

  /**
   * Helper: creates a full JSON snapshot of book metadata and chapters.
   */
  private static async createRevisionSnapshot(bookId: string, version: number, description?: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { chapters: { orderBy: { orderIndex: "asc" } } },
    });
    if (!book) return;

    let totalWords = 0;
    const chaptersData = book.chapters.map((ch) => {
      const plain = (ch.contentHtml || "").replace(/<[^>]+>/g, " ").trim();
      const count = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
      totalWords += count;
      return {
        id: ch.id,
        title: ch.title,
        subtitle: ch.subtitle,
        orderIndex: ch.orderIndex,
        contentHtml: ch.contentHtml,
        contentJson: ch.contentJson,
        wordCount: count,
      };
    });

    const snapshot = {
      title: book.title,
      subtitle: book.subtitle,
      description: book.description,
      coverTheme: book.coverTheme,
      coverTitle: book.coverTitle,
      coverSubtitle: book.coverSubtitle,
      coverAuthor: book.coverAuthor,
      visibility: book.visibility,
      status: book.status,
      chapters: chaptersData,
    };

    await prisma.bookRevision.create({
      data: {
        bookId,
        version,
        title: description || `Version ${version}`,
        description: description || null,
        visibility: book.visibility,
        snapshotJson: JSON.stringify(snapshot),
        chapterCount: chaptersData.length,
        wordCount: totalWords,
      },
    });
  }
}

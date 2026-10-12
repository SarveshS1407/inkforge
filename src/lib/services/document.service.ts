import slugify from "slugify";
import { prisma } from "../db";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  VersionConflictError,
} from "../errors";
import { CreateDocumentInput, UpdateDocumentInput } from "../../types/api";

function extractWordCount(html?: string | null, json?: string | null): number {
  if (html) {
    const text = html.replace(/<[^>]*>/g, " ").trim();
    return text.split(/\s+/).filter(Boolean).length;
  }
  if (json) {
    try {
      const parsed = JSON.parse(json);
      const text = JSON.stringify(parsed).replace(/[^a-zA-Z0-9\s]/g, " ");
      return text.split(/\s+/).filter(Boolean).length;
    } catch {
      return 0;
    }
  }
  return 0;
}

function calculateReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 220));
}

async function generateUniqueSlug(baseTitle: string, currentId?: string): Promise<string> {
  const cleanTitle = baseTitle.trim() || "untitled-document";
  const baseSlug = (slugify as unknown as (str: string, opts: object) => string)(cleanTitle, {
    lower: true,
    strict: true,
    trim: true,
  }) || "untitled";

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === currentId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

function hasMeaningfulContent(html?: string | null, json?: string | null): boolean {
  if (html) {
    const cleanText = html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .trim();
    if (cleanText.length > 0) return true;
  }
  if (json) {
    try {
      const parsed = typeof json === "string" ? JSON.parse(json) : json;
      const text = extractTextFromProseMirror(parsed).trim();
      if (text.length > 0) return true;
    } catch {
      // ignore parse error
    }
  }
  return false;
}

function extractTextFromProseMirror(node: any): string {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromProseMirror).join(" ");
  }
  return "";
}

export interface ListDocumentsParams {
  requesterId?: string;
  status?: string;
  publicationId?: string;
  authorId?: string;
  search?: string;
  sortBy?: "newest" | "oldest" | "readingTime" | "title";
  readingTimeFilter?: "short" | "medium" | "long";
  limit?: number;
  offset?: number;
}

export class DocumentService {
  /**
   * Validate that a document meets standards for publication.
   */
  static validateForPublishing(
    title: string,
    contentHtml?: string | null,
    contentJson?: string | null
  ) {
    if (!title || title.trim().length === 0) {
      throw new ValidationError("Document title is required before publication.");
    }
    const cleanTitle = title.trim();
    if (cleanTitle.length < 2) {
      throw new ValidationError("Document title must be at least 2 characters long.");
    }
    if (!hasMeaningfulContent(contentHtml, contentJson)) {
      throw new ValidationError(
        "Manuscript must contain meaningful prose before publication. Blank or empty documents cannot be published."
      );
    }
  }

  /**
   * List documents with security rules:
   * Public requests only see published documents.
   * Drafts and scheduled items require requesterId matching authorId.
   */
  static async listDocuments(params: ListDocumentsParams = {}) {
    const {
      requesterId,
      status,
      publicationId,
      authorId,
      search,
      sortBy = "newest",
      readingTimeFilter,
      limit = 20,
      offset = 0,
    } = params;

    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safeOffset = Math.max(offset, 0);

    const where: Record<string, unknown> = {};

    if (publicationId) {
      where.publicationId = publicationId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    // Security Filter:
    if (!requesterId) {
      // Unauthenticated callers can strictly only see PUBLISHED documents
      where.status = "PUBLISHED";
    } else if (status === "PUBLISHED") {
      // Caller explicitly requested public published feed
      where.status = "PUBLISHED";
    } else {
      // Non-published status or studio listing: enforce strict author ownership
      if (authorId && authorId !== requesterId) {
        // Querying another author's posts: restrict strictly to PUBLISHED
        where.status = "PUBLISHED";
      } else {
        // Author querying their own posts (studio dashboard)
        where.authorId = requesterId;
        if (status) {
          where.status = status;
        }
      }
    }

    // Search query filter (title, subtitle, excerpt, author name)
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { subtitle: { contains: q } },
        { excerpt: { contains: q } },
        { author: { displayName: { contains: q } } },
        { author: { username: { contains: q } } },
      ];
    }

    // Reading time filter
    if (readingTimeFilter) {
      if (readingTimeFilter === "short") {
        where.readingTimeMinutes = { lte: 4 };
      } else if (readingTimeFilter === "medium") {
        where.readingTimeMinutes = { gte: 5, lte: 10 };
      } else if (readingTimeFilter === "long") {
        where.readingTimeMinutes = { gt: 10 };
      }
    }

    // Deterministic ordering with tie-breaker
    let orderBy: any[];
    switch (sortBy) {
      case "oldest":
        orderBy = [{ publishedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }];
        break;
      case "readingTime":
        orderBy = [{ readingTimeMinutes: "desc" }, { id: "desc" }];
        break;
      case "title":
        orderBy = [{ title: "asc" }, { id: "desc" }];
        break;
      case "newest":
      default:
        orderBy = [{ publishedAt: "desc" }, { updatedAt: "desc" }, { id: "desc" }];
        break;
    }

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        take: safeLimit,
        skip: safeOffset,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          publication: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return { items, total, limit: safeLimit, offset: safeOffset };
  }

  /**
   * Retrieve a single document by ID with authorization checks.
   */
  static async getDocumentById(id: string, requesterId?: string) {
    const document = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        publication: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundError(`Document with ID '${id}' not found`);
    }

    // Private Draft Protection:
    if (document.status !== "PUBLISHED" && document.authorId !== requesterId) {
      throw new ForbiddenError("You do not have permission to view this unpublished draft.");
    }

    return document;
  }

  /**
   * Retrieve a single document by public slug.
   * If unpublished and requester is not the author, returns NotFoundError to prevent disclosure.
   */
  static async getDocumentBySlug(slug: string, requesterId?: string) {
    const document = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        publication: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundError(`Document with slug '${slug}' not found`);
    }

    if (document.status !== "PUBLISHED" && document.authorId !== requesterId) {
      throw new NotFoundError(`Document with slug '${slug}' not found`);
    }

    return document;
  }

  /**
   * Create a new document for an author.
   */
  static async createDocument(input: CreateDocumentInput, authorId: string) {
    if (!input.title || input.title.trim() === "") {
      throw new ValidationError("Document title is required.");
    }

    const slug = await generateUniqueSlug(input.title);
    const wordCount = extractWordCount(input.contentHtml, input.contentJson);
    const readingTimeMinutes = calculateReadingMinutes(wordCount);

    const isPublished = input.status === "PUBLISHED";
    const publishedAt = isPublished ? new Date() : null;

    const document = await prisma.post.create({
      data: {
        title: input.title.trim(),
        subtitle: input.subtitle?.trim() || null,
        slug,
        excerpt: input.excerpt?.trim() || null,
        contentJson: input.contentJson || null,
        contentHtml: input.contentHtml || null,
        status: input.status || "DRAFT",
        version: 1,
        targetWords: input.targetWords || 1200,
        readingTimeMinutes,
        coverImageUrl: input.coverImageUrl || null,
        publishedAt,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
        authorId,
        publicationId: input.publicationId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return document;
  }

  /**
   * Update an existing document with optimistic concurrency check.
   */
  static async updateDocument(
    id: string,
    input: UpdateDocumentInput,
    requesterId: string
  ) {
    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(`Document with ID '${id}' not found`);
    }

    // Ownership Verification:
    if (existing.authorId !== requesterId) {
      throw new ForbiddenError("You can only edit documents you own.");
    }

    // Optimistic Concurrency Conflict Detection:
    if (
      input.expectedVersion !== undefined &&
      input.expectedVersion !== existing.version
    ) {
      throw new VersionConflictError(existing.version, input.expectedVersion, {
        documentId: id,
        currentUpdatedAt: existing.updatedAt,
      });
    }

    const nextVersion = existing.version + 1;

    // Recompute slug if title changed
    let slug = existing.slug;
    if (input.title && input.title.trim() !== existing.title) {
      slug = await generateUniqueSlug(input.title, existing.id);
    }

    const nextTitle = input.title !== undefined ? input.title.trim() : existing.title;
    const nextHtml = input.contentHtml !== undefined ? input.contentHtml : existing.contentHtml;
    const nextJson = input.contentJson !== undefined ? input.contentJson : existing.contentJson;
    const wordCount = extractWordCount(nextHtml, nextJson);
    const readingTimeMinutes = calculateReadingMinutes(wordCount);

    const willBePublished = input.status === "PUBLISHED";
    if (willBePublished) {
      this.validateForPublishing(nextTitle, nextHtml, nextJson);
    }

    const publishedAt =
      willBePublished && !existing.publishedAt
        ? new Date()
        : existing.publishedAt;
    const canonicalUrl = willBePublished ? (existing.canonicalUrl || `/read/${slug}`) : existing.canonicalUrl;

    // Execute revision creation and document update atomically in a single transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Snapshot revision if substantial content exists
      if (
        existing.contentJson &&
        input.contentJson &&
        existing.contentJson !== input.contentJson
      ) {
        await tx.postRevision.create({
          data: {
            postId: existing.id,
            version: existing.version,
            title: existing.title,
            contentJson: existing.contentJson,
            wordCount: extractWordCount(existing.contentHtml, existing.contentJson),
            excerpt: existing.excerpt,
          },
        });
      }

      return await tx.post.update({
        where: { id },
        data: {
          title: input.title !== undefined ? input.title.trim() : undefined,
          subtitle: input.subtitle !== undefined ? input.subtitle?.trim() || null : undefined,
          slug,
          excerpt: input.excerpt !== undefined ? input.excerpt?.trim() || null : undefined,
          contentJson: input.contentJson !== undefined ? input.contentJson : undefined,
          contentHtml: input.contentHtml !== undefined ? input.contentHtml : undefined,
          status: input.status !== undefined ? input.status : undefined,
          version: nextVersion,
          targetWords: input.targetWords !== undefined ? input.targetWords : undefined,
          readingTimeMinutes,
          coverImageUrl: input.coverImageUrl !== undefined ? input.coverImageUrl : undefined,
          publishedAt,
          canonicalUrl,
          scheduledFor: input.scheduledFor !== undefined ? (input.scheduledFor ? new Date(input.scheduledFor) : null) : undefined,
          publicationId: input.publicationId !== undefined ? input.publicationId : undefined,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          publication: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });

    return updated;
  }

  /**
   * Explicitly publish an existing manuscript.
   */
  static async publishDocument(id: string, requesterId: string, expectedVersion?: number) {
    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(`Document with ID '${id}' not found`);
    }

    if (existing.authorId !== requesterId) {
      throw new ForbiddenError("You can only publish documents you own.");
    }

    if (expectedVersion !== undefined && expectedVersion !== existing.version) {
      throw new VersionConflictError(existing.version, expectedVersion, {
        documentId: id,
        currentUpdatedAt: existing.updatedAt,
      });
    }

    this.validateForPublishing(existing.title, existing.contentHtml, existing.contentJson);

    const canonicalUrl = `/read/${existing.slug}`;
    const nextVersion = existing.version + 1;
    const publishedAt = existing.publishedAt || new Date();

    const published = await prisma.$transaction(async (tx) => {
      await tx.postRevision.create({
        data: {
          postId: existing.id,
          version: existing.version,
          title: existing.title,
          contentJson: existing.contentJson || JSON.stringify({ type: "doc" }),
          wordCount: extractWordCount(existing.contentHtml, existing.contentJson),
          excerpt: existing.excerpt,
        },
      });

      return await tx.post.update({
        where: { id },
        data: {
          status: "PUBLISHED",
          publishedAt,
          canonicalUrl,
          version: nextVersion,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          publication: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });

    return published;
  }

  /**
   * Explicitly unpublish a published work, converting it back to a private draft.
   */
  static async unpublishDocument(id: string, requesterId: string, expectedVersion?: number) {
    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(`Document with ID '${id}' not found`);
    }

    if (existing.authorId !== requesterId) {
      throw new ForbiddenError("You can only unpublish documents you own.");
    }

    if (expectedVersion !== undefined && expectedVersion !== existing.version) {
      throw new VersionConflictError(existing.version, expectedVersion, {
        documentId: id,
        currentUpdatedAt: existing.updatedAt,
      });
    }

    const nextVersion = existing.version + 1;

    const unpublished = await prisma.$transaction(async (tx) => {
      await tx.postRevision.create({
        data: {
          postId: existing.id,
          version: existing.version,
          title: existing.title,
          contentJson: existing.contentJson || JSON.stringify({ type: "doc" }),
          wordCount: extractWordCount(existing.contentHtml, existing.contentJson),
          excerpt: existing.excerpt,
        },
      });

      return await tx.post.update({
        where: { id },
        data: {
          status: "DRAFT",
          version: nextVersion,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          publication: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });

    return unpublished;
  }

  /**
   * Delete document by ID (Author only).
   */
  static async deleteDocument(id: string, requesterId: string) {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existing) {
      throw new NotFoundError(`Document with ID '${id}' not found`);
    }

    if (existing.authorId !== requesterId) {
      throw new ForbiddenError("You can only delete your own documents.");
    }

    await prisma.post.delete({
      where: { id },
    });

    return { id, deleted: true };
  }

  /**
   * List document revision snapshots.
   */
  static async getDocumentRevisions(id: string, requesterId: string) {
    const doc = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!doc) {
      throw new NotFoundError(`Document with ID '${id}' not found`);
    }

    if (doc.authorId !== requesterId) {
      throw new ForbiddenError("You can only inspect revisions for your own documents.");
    }

    const revisions = await prisma.postRevision.findMany({
      where: { postId: id },
      orderBy: { createdAt: "desc" },
    });

    return revisions;
  }

  /**
   * Restore a historical revision snapshot to the active document.
   * Enforces:
   * 1. Document existence (404)
   * 2. Author ownership (403)
   * 3. Revision existence (404)
   * 4. Revision-belongs-to-document check (400)
   * 5. Atomic transaction creating pre-restore snapshot & incrementing OCC version
   */
  static async restoreRevision(
    documentId: string,
    revisionId: string,
    requesterId: string
  ) {
    const existing = await prisma.post.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      throw new NotFoundError(`Document with ID '${documentId}' not found`);
    }

    if (existing.authorId !== requesterId) {
      throw new ForbiddenError("You can only restore revisions for your own documents.");
    }

    const revision = await prisma.postRevision.findUnique({
      where: { id: revisionId },
    });

    if (!revision) {
      throw new NotFoundError(`Revision with ID '${revisionId}' not found`);
    }

    if (revision.postId !== documentId) {
      throw new ValidationError("The specified revision does not belong to this manuscript.");
    }

    const nextVersion = existing.version + 1;
    const restoredWordCount = revision.wordCount || extractWordCount(existing.contentHtml, revision.contentJson);
    const readingTimeMinutes = calculateReadingMinutes(restoredWordCount);

    const restored = await prisma.$transaction(async (tx) => {
      // 1. Snapshot the current state before rolling back so no work is permanently lost
      await tx.postRevision.create({
        data: {
          postId: existing.id,
          version: existing.version,
          title: existing.title,
          contentJson: existing.contentJson || JSON.stringify({ type: "doc" }),
          wordCount: extractWordCount(existing.contentHtml, existing.contentJson),
          excerpt: existing.excerpt,
        },
      });

      // 2. Restore the target revision content
      return await tx.post.update({
        where: { id: documentId },
        data: {
          title: revision.title,
          contentJson: revision.contentJson,
          excerpt: revision.excerpt,
          version: nextVersion,
          readingTimeMinutes,
          updatedAt: new Date(),
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          publication: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });

    return restored;
  }
}


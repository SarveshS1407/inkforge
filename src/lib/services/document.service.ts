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

export interface ListDocumentsParams {
  requesterId?: string;
  status?: string;
  publicationId?: string;
  authorId?: string;
  limit?: number;
  offset?: number;
}

export class DocumentService {
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
      limit = 20,
      offset = 0,
    } = params;

    const where: Record<string, unknown> = {};

    if (publicationId) {
      where.publicationId = publicationId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    // Security Filter:
    // If not specifying requester or requester is querying someone else,
    // restrict strictly to published documents.
    if (!requesterId || (authorId && authorId !== requesterId)) {
      where.status = "PUBLISHED";
    } else if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        take: Math.min(limit, 100),
        skip: offset,
        orderBy: { updatedAt: "desc" },
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

    return { items, total, limit, offset };
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
      throw new ForbiddenError("This document has not been published yet.");
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

    const nextHtml = input.contentHtml !== undefined ? input.contentHtml : existing.contentHtml;
    const nextJson = input.contentJson !== undefined ? input.contentJson : existing.contentJson;
    const wordCount = extractWordCount(nextHtml, nextJson);
    const readingTimeMinutes = calculateReadingMinutes(wordCount);

    const willBePublished = input.status === "PUBLISHED";
    const publishedAt =
      willBePublished && !existing.publishedAt
        ? new Date()
        : existing.publishedAt;

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
        },
      });
    });

    return updated;
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
}

/**
 * INKFORGE — COLLECTION & READING LIST SERVICE
 * Server-side management of curated anthologies, reading lists, and monograph memberships.
 * Enforces strict authorization, privacy boundaries, and referential integrity.
 */

import { prisma } from "../db";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from "../errors";
import slugify from "slugify";

export interface CreateCollectionInput {
  title: string;
  description?: string | null;
  isPublic?: boolean;
}

export interface UpdateCollectionInput {
  title?: string;
  description?: string | null;
  isPublic?: boolean;
}

export interface ListCollectionsParams {
  ownerId?: string;
  requesterId?: string;
  limit?: number;
  offset?: number;
}

async function generateUniqueCollectionSlug(ownerId: string, title: string): Promise<string> {
  const baseSlug = slugify(title, { lower: true, strict: true, trim: true }) || "collection";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.collection.findUnique({
      where: {
        ownerId_slug: { ownerId, slug },
      },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export class CollectionService {
  /**
   * Create a new collection for a user.
   */
  static async createCollection(ownerId: string, input: CreateCollectionInput) {
    if (!ownerId) {
      throw new ValidationError("Owner ID is required to create a collection.");
    }

    const title = input.title?.trim();
    if (!title || title.length < 2) {
      throw new ValidationError("Collection title must be at least 2 characters long.");
    }
    if (title.length > 100) {
      throw new ValidationError("Collection title cannot exceed 100 characters.");
    }

    const description = input.description?.trim() || null;
    if (description && description.length > 500) {
      throw new ValidationError("Collection description cannot exceed 500 characters.");
    }

    const slug = await generateUniqueCollectionSlug(ownerId, title);

    const collection = await prisma.collection.create({
      data: {
        title,
        slug,
        description,
        isPublic: input.isPublic !== undefined ? Boolean(input.isPublic) : true,
        ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    return collection;
  }

  /**
   * Update an existing collection (title, description, isPublic).
   */
  static async updateCollection(
    collectionId: string,
    ownerId: string,
    input: UpdateCollectionInput
  ) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundError(`Collection with ID '${collectionId}' not found.`);
    }

    if (collection.ownerId !== ownerId) {
      throw new ForbiddenError("You do not have permission to modify this collection.");
    }

    const data: Record<string, unknown> = {};

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title || title.length < 2) {
        throw new ValidationError("Collection title must be at least 2 characters long.");
      }
      if (title.length > 100) {
        throw new ValidationError("Collection title cannot exceed 100 characters.");
      }
      data.title = title;
      if (title !== collection.title) {
        data.slug = await generateUniqueCollectionSlug(ownerId, title);
      }
    }

    if (input.description !== undefined) {
      const description = input.description ? input.description.trim() : null;
      if (description && description.length > 500) {
        throw new ValidationError("Collection description cannot exceed 500 characters.");
      }
      data.description = description;
    }

    if (input.isPublic !== undefined) {
      data.isPublic = Boolean(input.isPublic);
    }

    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a collection. Cascades cleanly to remove items without orphaned records.
   */
  static async deleteCollection(collectionId: string, ownerId: string) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundError(`Collection with ID '${collectionId}' not found.`);
    }

    if (collection.ownerId !== ownerId) {
      throw new ForbiddenError("You do not have permission to delete this collection.");
    }

    await prisma.collection.delete({
      where: { id: collectionId },
    });

    return { success: true, id: collectionId };
  }

  /**
   * Retrieve a single collection with its items and posts.
   */
  static async getCollectionById(collectionId: string, requesterId?: string) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        items: {
          orderBy: [{ orderIndex: "asc" }, { addedAt: "asc" }],
          include: {
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                status: true,
                readingTimeMinutes: true,
                publishedAt: true,
                createdAt: true,
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
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    if (!collection) {
      throw new NotFoundError(`Collection with ID '${collectionId}' not found.`);
    }

    const isOwner = requesterId && collection.ownerId === requesterId;

    // Privacy boundary: Private collections are strictly visible only to their owner
    if (!collection.isPublic && !isOwner) {
      throw new ForbiddenError("This collection is private.");
    }

    // Filter items: non-owners cannot see unpublished drafts even if added by the author
    const filteredItems = isOwner
      ? collection.items
      : collection.items.filter((item) => item.post.status === "PUBLISHED");

    return {
      ...collection,
      items: filteredItems,
      itemCount: filteredItems.length,
      isOwner,
    };
  }

  /**
   * List collections (supports author-filtered, mine, or public anthology directory).
   */
  static async listCollections(params: ListCollectionsParams = {}) {
    const { ownerId, requesterId, limit = 20, offset = 0 } = params;

    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safeOffset = Math.max(offset, 0);

    const where: Record<string, unknown> = {};

    if (ownerId) {
      where.ownerId = ownerId;
      // If querying another author's collections, strictly enforce isPublic: true
      if (ownerId !== requesterId) {
        where.isPublic = true;
      }
    } else {
      // Public anthology directory: strictly return public collections
      where.isPublic = true;
    }

    const [items, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        take: safeLimit,
        skip: safeOffset,
        orderBy: { updatedAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          items: {
            take: 4,
            orderBy: [{ orderIndex: "asc" }, { addedAt: "asc" }],
            include: {
              post: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  readingTimeMinutes: true,
                  status: true,
                },
              },
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.collection.count({ where }),
    ]);

    return { items, total, limit: safeLimit, offset: safeOffset };
  }

  /**
   * Add a monograph to a collection.
   */
  static async addItemToCollection(
    collectionId: string,
    ownerId: string,
    postId: string
  ) {
    if (!postId) {
      throw new ValidationError("Post ID is required to add to a collection.");
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundError(`Collection with ID '${collectionId}' not found.`);
    }

    if (collection.ownerId !== ownerId) {
      throw new ForbiddenError("You do not have permission to modify this collection.");
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true, authorId: true, title: true },
    });

    if (!post) {
      throw new NotFoundError(`Manuscript with ID '${postId}' not found.`);
    }

    // Security check: Only published works or works authored by this user can be added
    if (post.status !== "PUBLISHED" && post.authorId !== ownerId) {
      throw new ForbiddenError("You cannot add unpublished drafts by other authors to a collection.");
    }

    // Check duplicate membership
    const existingItem = await prisma.collectionItem.findUnique({
      where: {
        collectionId_postId: { collectionId, postId },
      },
    });

    if (existingItem) {
      throw new ConflictError(`Manuscript '${post.title}' is already part of this collection.`);
    }

    // Calculate next orderIndex
    const lastItem = await prisma.collectionItem.findFirst({
      where: { collectionId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const nextOrder = (lastItem?.orderIndex ?? -1) + 1;

    const item = await prisma.collectionItem.create({
      data: {
        collectionId,
        postId,
        orderIndex: nextOrder,
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    // Touch collection updatedAt
    await prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    });

    return item;
  }

  /**
   * Remove a monograph from a collection.
   */
  static async removeItemFromCollection(
    collectionId: string,
    ownerId: string,
    postId: string
  ) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundError(`Collection with ID '${collectionId}' not found.`);
    }

    if (collection.ownerId !== ownerId) {
      throw new ForbiddenError("You do not have permission to modify this collection.");
    }

    const existing = await prisma.collectionItem.findUnique({
      where: {
        collectionId_postId: { collectionId, postId },
      },
    });

    if (!existing) {
      throw new NotFoundError("This monograph is not in the specified collection.");
    }

    await prisma.collectionItem.delete({
      where: {
        collectionId_postId: { collectionId, postId },
      },
    });

    // Touch collection updatedAt
    await prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    });

    return { success: true, collectionId, postId };
  }

  /**
   * Get user's collections with indication of whether a specific post is in each one.
   * Enables the "Add to Collection" / "Bookmark" popover in Reader and Discover.
   */
  static async getUserCollectionsForPost(userId: string, postId: string) {
    const collections = await prisma.collection.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        items: {
          where: { postId },
          select: { id: true },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    return collections.map((col) => ({
      id: col.id,
      title: col.title,
      slug: col.slug,
      isPublic: col.isPublic,
      itemCount: col._count.items,
      hasPost: col.items.length > 0,
      updatedAt: col.updatedAt,
    }));
  }
}

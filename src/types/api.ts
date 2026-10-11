export type DocumentStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";

export interface CreateDocumentInput {
  title: string;
  subtitle?: string;
  excerpt?: string;
  contentJson?: string;
  contentHtml?: string;
  status?: DocumentStatus;
  targetWords?: number;
  publicationId?: string;
  coverImageUrl?: string;
  scheduledFor?: string | Date;
}

export interface UpdateDocumentInput {
  title?: string;
  subtitle?: string;
  excerpt?: string;
  contentJson?: string;
  contentHtml?: string;
  status?: DocumentStatus;
  targetWords?: number;
  publicationId?: string;
  coverImageUrl?: string;
  scheduledFor?: string | Date;
  expectedVersion?: number; // Concurrency control
}

export interface DocumentResponse {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  contentJson: string | null;
  contentHtml: string | null;
  status: string;
  version: number;
  targetWords: number;
  readingTimeMinutes: number;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  authorId: string;
  publicationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  publication?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// ============================================================================
// AUTHENTICATION INTERFACES
// ============================================================================

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
  emailVerified: Date | null;
  profile?: {
    displayName: string;
    slug: string | null;
    bio: string | null;
    avatarUrl: string | null;
    websiteUrl: string | null;
    location: string | null;
  } | null;
}

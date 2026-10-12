# INKFORGE — API & Integrations Reference

This document provides a comprehensive technical reference for the INKFORGE REST API and external service integrations.

All API routes are served under `/api/` using Next.js App Router Route Handlers (`route.ts`).

---

## 1. Architectural Standards & Response Format

### Envelope Standard
All JSON responses adhere to the standard envelope format defined in [`src/lib/api/response.ts`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/lib/api/response.ts):

#### Success Response (`ApiSuccessResponse<T>`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

#### Error Response (`ApiErrorResponse`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Title is required and must not exceed 255 characters",
    "details": [
      { "field": "title", "issue": "Too short" }
    ]
  }
}
```

### Standard Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource created successfully.
- `400 Bad Request`: Invalid request payload or parameters.
- `401 Unauthorized`: Authentication required or invalid/expired session.
- `403 Forbidden`: Authenticated user lacks permission to access resource.
- `404 Not Found`: Requested resource does not exist.
- `409 Conflict`: Resource state conflict (e.g., version mismatch, unique constraint violation).
- `422 Unprocessable Entity`: Semantic validation failure.
- `429 Too Many Requests`: Rate limit exceeded (e.g., AI Copilot sliding window).
- `500 Internal Server Error`: Unhandled application exception.
- `503 Service Unavailable`: Upstream service or database temporarily unavailable.

### Authentication & Session Management
- Authentication uses secure, `HttpOnly`, `SameSite=Lax` cookies named `session_token`.
- Routes enforce authentication via [`requireAuth(req)`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/lib/auth/guard.ts) or [`getCurrentUser(req)`](file:///Users/kingpin/Documents/Vibecoded%20projects/inkforge/src/lib/auth/session.ts).
- Authorization checks ensure documents, revisions, and private collections can only be modified by their authors.

---

## 2. Authentication Endpoints

### Register User
- **Route:** `POST /api/v1/auth/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "author@example.com",
    "password": "SecurePassword123!",
    "name": "Jane Eyre",
    "username": "janeeyre"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "cuid...",
        "email": "author@example.com",
        "name": "Jane Eyre",
        "username": "janeeyre",
        "emailVerified": null
      }
    }
  }
  ```

### Log In
- **Route:** `POST /api/v1/auth/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "author@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response:** `200 OK` (Sets `session_token` cookie)
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "cuid...",
        "email": "author@example.com",
        "name": "Jane Eyre",
        "username": "janeeyre"
      }
    }
  }
  ```

### Log Out
- **Route:** `POST /api/v1/auth/logout`
- **Auth:** Authenticated
- **Response:** `200 OK` (Expires `session_token` cookie and revokes DB session)
  ```json
  {
    "success": true,
    "data": { "message": "Successfully logged out" }
  }
  ```

### Get Current User Profile
- **Route:** `GET /api/v1/auth/me`
- **Auth:** Authenticated
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "cuid...",
        "email": "author@example.com",
        "name": "Jane Eyre",
        "username": "janeeyre",
        "profile": {
          "bio": "Novelist & poet",
          "avatarUrl": null,
          "website": "https://eyre.press"
        }
      }
    }
  }
  ```

### Request Password Reset
- **Route:** `POST /api/v1/auth/forgot-password`
- **Auth:** Public
- **Request Body:**
  ```json
  { "email": "author@example.com" }
  ```
- **Response:** `200 OK` (Generates token, dispatches reset email via Resend)
  ```json
  {
    "success": true,
    "data": { "message": "Password reset email sent if account exists" }
  }
  ```

### Reset Password
- **Route:** `POST /api/v1/auth/reset-password`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "token": "reset-token-uuid",
    "password": "NewStrongPassword456!"
  }
  ```
- **Response:** `200 OK`

### Verify Email
- **Route:** `GET /api/v1/auth/verify-email?token=...` or `POST /api/v1/auth/verify-email`
- **Auth:** Public
- **Response:** `200 OK` (Updates `emailVerified` timestamp)

### Resend Email Verification
- **Route:** `POST /api/v1/auth/resend-verification`
- **Auth:** Public / Authenticated
- **Request Body:**
  ```json
  { "email": "author@example.com" }
  ```
- **Response:** `200 OK`

---

## 3. Documents & Publishing Endpoints

### List User Documents
- **Route:** `GET /api/v1/documents`
- **Auth:** Authenticated
- **Query Parameters:**
  - `status`: Filter by `DRAFT` | `PUBLISHED` | `ARCHIVED`
  - `page`: Page index (default: `1`)
  - `limit`: Items per page (default: `20`)
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "doc_cuid123",
        "title": "The Geometry of Silence",
        "subtitle": "Notes on monastic typography",
        "status": "DRAFT",
        "version": 4,
        "wordCount": 1420,
        "updatedAt": "2026-10-12T08:30:00Z"
      }
    ]
  }
  ```

### Create Document
- **Route:** `POST /api/v1/documents`
- **Auth:** Authenticated
- **Request Body:**
  ```json
  {
    "title": "New Manuscript",
    "subtitle": "Subtitle text",
    "content": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"First sentence...\"}]}]}",
    "contentType": "JSON",
    "status": "DRAFT",
    "tags": ["philosophy", "typography"]
  }
  ```
- **Response:** `201 Created`

### Retrieve Document by ID
- **Route:** `GET /api/v1/documents/:id`
- **Auth:** Authenticated (Owner or published reader)
- **Response:** `200 OK` (Full manuscript including AST content, version, and tags)

### Update Document (Autosave & Concurrency)
- **Route:** `PATCH /api/v1/documents/:id`
- **Auth:** Authenticated (Owner only)
- **Request Body:**
  ```json
  {
    "title": "Updated Title",
    "subtitle": "Optional subtitle",
    "content": "{\"type\":\"doc\", ...}",
    "version": 4,
    "tags": ["philosophy"]
  }
  ```
- **Optimistic Concurrency Control:**
  - If the sent `version` does not match the database version, returns `409 Conflict` with latest server snapshot to prevent silent overwrite.
  - On valid update, increments `version` and automatically archives previous snapshot to `PostRevision`.
- **Response:** `200 OK`

### Delete Document
- **Route:** `DELETE /api/v1/documents/:id`
- **Auth:** Authenticated (Owner only)
- **Response:** `200 OK`

### Publish Document
- **Route:** `POST /api/v1/documents/:id/publish`
- **Auth:** Authenticated (Owner only)
- **Request Body:** Optional custom slug or publication settings
- **Behavior:**
  - Generates URL slug via `slugify`.
  - Sets `status: "PUBLISHED"` and `publishedAt: new Date()`.
- **Response:** `200 OK` with public URL slug

### Unpublish Document
- **Route:** `POST /api/v1/documents/:id/unpublish`
- **Auth:** Authenticated (Owner only)
- **Behavior:** Reverts `status: "DRAFT"` and revokes public visibility.

### Retrieve Revision History
- **Route:** `GET /api/v1/documents/:id/revisions`
- **Auth:** Authenticated (Owner only)
- **Response:** `200 OK` (List of historical snapshots with timestamps and word counts)

### Public Read by Slug
- **Route:** `GET /api/v1/documents/by-slug/:slug`
- **Auth:** Public
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "id": "doc_cuid123",
      "title": "The Geometry of Silence",
      "slug": "the-geometry-of-silence",
      "content": "...",
      "publishedAt": "2026-10-12T09:00:00Z",
      "readingTimeMinutes": 6,
      "author": {
        "name": "Jane Eyre",
        "username": "janeeyre",
        "profile": { "bio": "..." }
      }
    }
  }
  ```

---

## 4. Collections Endpoints

### List Collections
- **Route:** `GET /api/v1/collections`
- **Auth:** Public / Authenticated
- **Query Parameters:** `userId`, `publicOnly` (boolean)
- **Response:** `200 OK`

### Create Collection
- **Route:** `POST /api/v1/collections`
- **Auth:** Authenticated
- **Request Body:**
  ```json
  {
    "title": "Selected Critical Essays",
    "description": "Studies in modernist aesthetics",
    "isPublic": true
  }
  ```
- **Response:** `201 Created`

### Retrieve Collection by ID
- **Route:** `GET /api/v1/collections/:id`
- **Auth:** Public (if `isPublic`) or Authenticated (Owner)
- **Response:** `200 OK` (Includes ordered monographs in `items`)

### Update Collection
- **Route:** `PATCH /api/v1/collections/:id`
- **Auth:** Authenticated (Owner)
- **Request Body:** `{ "title": "...", "description": "...", "isPublic": false }`
- **Response:** `200 OK`

### Delete Collection
- **Route:** `DELETE /api/v1/collections/:id`
- **Auth:** Authenticated (Owner)
- **Response:** `200 OK`

### Add Story to Collection
- **Route:** `POST /api/v1/collections/:id/items`
- **Auth:** Authenticated (Owner)
- **Request Body:** `{ "postId": "doc_cuid123", "order": 0 }`
- **Response:** `201 Created`

### Remove Story from Collection
- **Route:** `DELETE /api/v1/collections/:id/items/:postId`
- **Auth:** Authenticated (Owner)
- **Response:** `200 OK`

### Find Collections by Post
- **Route:** `GET /api/v1/collections/by-post/:postId`
- **Auth:** Authenticated / Public
- **Response:** `200 OK`

---

## 5. Authors Endpoints

### List Public Authors
- **Route:** `GET /api/v1/authors`
- **Auth:** Public
- **Query Parameters:**
  - `page`: Page index (default: `1`)
  - `limit`: Authors per page (default: `24`)
  - `q`: Search query string
- **Response:** `200 OK` (Includes author stats: publication count, follower count, bio)

### Retrieve Author Profile
- **Route:** `GET /api/v1/authors/:username`
- **Auth:** Public
- **Response:** `200 OK` (Author metadata, profile details, and list of published works)

---

## 6. AI Copilot & Cover Generator Endpoints

### Execute AI Copilot Task
- **Route:** `POST /api/v1/ai/copilot`
- **Auth:** Authenticated
- **Rate Limit:** 30 requests / minute per author (in-memory sliding window)
- **Request Body (`AiCopilotRequestInput`):**
  ```json
  {
    "taskType": "CONTINUE" | "REWRITE" | "TONE_SHIFT" | "SUMMARIZE" | "REVIEW",
    "selectedText": "The train departed promptly at dusk...",
    "cursorContext": "Preceding paragraphs for continuity...",
    "toneTarget": "literary" | "academic" | "concise" | "lyrical",
    "instruction": "Continue in a melancholic tone",
    "documentId": "doc_cuid123"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "suggestion": "Leaving behind the soot-laden arches...",
      "taskType": "CONTINUE",
      "provider": "gemini" | "openai" | "editorial_mock",
      "tokensUsed": 128
    }
  }
  ```

### AI Copilot Status
- **Route:** `GET /api/v1/ai/status`
- **Auth:** Public
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "activeProvider": "gemini",
      "configured": true,
      "providers": {
        "gemini": true,
        "openai": false,
        "mock": true
      }
    }
  }
  ```

### Interpret Manuscript Brief
- **Route:** `POST /api/covers/interpret`
- **Auth:** Authenticated
- **Request Body:** `{ "manuscriptText": "Full excerpt...", "title": "...", "genre": "..." }`
- **Response:** `200 OK` (Visual motifs, chromatic palettes, typography recommendations)

### Generate Cover Artwork
- **Route:** `POST /api/covers/generate`
- **Auth:** Authenticated
- **Request Body:**
  ```json
  {
    "context": { "title": "...", "author": "..." },
    "brief": { "concepts": [ { "id": "concept_1", "description": "..." } ] },
    "conceptId": "concept_1",
    "refinement": "Deep indigo foil stamping"
  }
  ```
- **Response:** `200 OK` (Artwork URL or SVG generation asset)

### Cover Generator Status
- **Route:** `GET /api/covers/status`
- **Auth:** Public
- **Response:** `200 OK`

---

## 7. System & Health Endpoint

### API Healthcheck
- **Route:** `GET /api/v1/health`
- **Auth:** Public
- **Response:** `200 OK` (Healthy) or `503 Service Unavailable` (Degraded)
  ```json
  {
    "success": true,
    "data": {
      "service": "inkforge-api",
      "version": "1.0.0",
      "timestamp": "2026-10-12T12:00:00.000Z",
      "environment": "production",
      "database": {
        "status": "connected",
        "provider": "postgresql",
        "latencyMs": 14
      },
      "status": "healthy"
    }
  }
  ```

---

## 8. External Services & Providers

| Service | Protocol / SDK | Purpose | Configuration Keys |
| :--- | :--- | :--- | :--- |
| **Supabase PostgreSQL** | TCP / Prisma Client (`@prisma/client`) | Primary relational data store & transaction pooling | `DATABASE_URL` (Port 6543, `?pgbouncer=true`), `DIRECT_URL` (Port 5432) |
| **Resend** | REST / HTTPS API | Transactional emails (verification, reset) | `RESEND_API_KEY`, `EMAIL_FROM` |
| **Google Gemini** | Google GenAI SDK | AI Writing Copilot prose completion & review | `GEMINI_API_KEY` |
| **OpenAI** | REST / OpenAI SDK | Alternative Copilot provider & DALL-E cover art | `OPENAI_API_KEY` |
| **Vercel Edge & Serverless**| Next.js Runtime | Deployment host, edge caching, serverless execution | Managed via Vercel platform |

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "INTERNAL_SERVER_ERROR",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation error", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict detected", details?: unknown) {
    super(message, 409, "CONFLICT", details);
  }
}

export class VersionConflictError extends AppError {
  constructor(
    currentVersion: number,
    expectedVersion: number,
    details?: unknown
  ) {
    super(
      `Document version conflict: current server version is ${currentVersion}, but expected ${expectedVersion}.`,
      409,
      "VERSION_CONFLICT",
      { currentVersion, expectedVersion, ...((details as object) || {}) }
    );
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests. Please try again later.", details?: unknown) {
    super(message, 429, "TOO_MANY_REQUESTS", details);
  }
}

export class EmailDeliveryError extends AppError {
  constructor(message = "Failed to deliver email message.", details?: unknown) {
    super(message, 502, "EMAIL_DELIVERY_ERROR", details);
  }
}

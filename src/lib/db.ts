import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export interface DatabaseHealth {
  status: "connected" | "unreachable";
  latencyMs: number;
  provider: string;
  error?: string;
}

/**
 * Minimal active database connectivity verification
 */
export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  const start = performance.now();
  try {
    // Lightweight count query to test real database roundtrip
    await prisma.user.count();
    const latencyMs = Math.round(performance.now() - start);

    return {
      status: "connected",
      latencyMs,
      provider: process.env.DATABASE_URL?.startsWith("file:")
        ? "sqlite"
        : "postgresql",
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : "Unknown database error";
    console.error("Database connectivity check failed:", message);

    return {
      status: "unreachable",
      latencyMs,
      provider: process.env.DATABASE_URL?.startsWith("file:")
        ? "sqlite"
        : "postgresql",
      error: message,
    };
  }
}

/**
 * Normalizes Prisma error codes into consistent, safe error messages
 */
export function normalizePrismaError(error: unknown): {
  statusCode: number;
  code: string;
  message: string;
} {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const target = (error.meta?.target as string[]) || ["field"];
        return {
          statusCode: 409,
          code: "CONFLICT",
          message: `A record with this ${target.join(", ")} already exists.`,
        };
      }
      case "P2025":
        return {
          statusCode: 404,
          code: "NOT_FOUND",
          message: "The requested record was not found.",
        };
      case "P2003":
        return {
          statusCode: 400,
          code: "FOREIGN_KEY_VIOLATION",
          message: "Referenced relation does not exist.",
        };
      default:
        return {
          statusCode: 500,
          code: `DB_${error.code}`,
          message: "A database error occurred during operation execution.",
        };
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Database query validation failed. Check required fields and types.",
    };
  }

  return {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "An unexpected server error occurred.",
  };
}

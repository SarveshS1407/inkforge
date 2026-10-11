import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbHealth = await checkDatabaseConnection();

    const healthData = {
      service: "inkforge-api",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: dbHealth,
      status: dbHealth.status === "connected" ? "healthy" : "degraded",
    };

    if (dbHealth.status !== "connected") {
      return apiError(
        "Database connectivity check failed",
        "DATABASE_UNAVAILABLE",
        503,
        healthData
      );
    }

    return apiSuccess(healthData, undefined, 200);
  } catch (error) {
    console.error("Healthcheck error:", error);
    return apiError(
      "Healthcheck execution failed",
      "HEALTH_CHECK_FAILED",
      500
    );
  }
}

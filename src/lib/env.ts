import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL must be specified"),
  DIRECT_URL: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("INKFORGE <onboarding@resend.dev>"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  INKFORGE_AI_PROVIDER: z.enum(["gemini", "openai", "mock"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    INKFORGE_AI_PROVIDER: process.env.INKFORGE_AI_PROVIDER,
  });

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables detected:",
      parsed.error.format()
    );
    throw new Error(
      `Environment configuration error: ${parsed.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ")}`
    );
  }

  // Production warning if protocol is insecure on non-localhost
  if (
    parsed.data.NODE_ENV === "production" &&
    parsed.data.NEXT_PUBLIC_APP_URL.startsWith("http://") &&
    !parsed.data.NEXT_PUBLIC_APP_URL.includes("localhost")
  ) {
    console.warn(
      "⚠️ Security Warning: NEXT_PUBLIC_APP_URL uses insecure http:// in production. Use https://."
    );
  }

  return parsed.data;
}

export const env = validateEnv();

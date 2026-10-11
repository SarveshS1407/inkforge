import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL must be specified"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("INKFORGE <onboarding@resend.dev>"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
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

  return parsed.data;
}

export const env = validateEnv();

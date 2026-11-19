import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),
  APP_URL: z.string().url(),
  PAYSTACK_SECRET_KEY: z.string().startsWith("sk_"),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
});

export const env = envSchema.parse(process.env);
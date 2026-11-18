import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),
  PAYFAST_MERCHANT_ID: z.string().min(1),
  PAYFAST_MERCHANT_KEY: z.string().min(1),
  PAYFAST_PASSPHRASE: z.string().optional().default(""),
  PAYFAST_SANDBOX: z.enum(["true", "false"]).default("true"),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
});

export const env = envSchema.parse(process.env);
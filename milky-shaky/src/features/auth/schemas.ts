import { z } from "zod";

/**
 * Converts a South African mobile number to +27 format.
 * Accepts 0821234567, 082 123 4567, or +27821234567.
 * Returns null if the number isn't valid.
 */
export function normalizeMobile(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, "");
  if (/^0\d{9}$/.test(digits)) return "+27" + digits.slice(1);
  if (/^\+27\d{9}$/.test(digits)) return digits;
  return null;
}

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  email: z.email("Enter a valid email address").transform((v) => v.toLowerCase()),
  mobile: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const normalized = normalizeMobile(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "Enter a valid South African mobile number" });
        return z.NEVER;
      }
      return normalized;
    }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
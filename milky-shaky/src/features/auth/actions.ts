"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { consumeRateLimit, getClientIp, peekRateLimit } from "@/features/security/rate-limit";
import { loginSchema, signupSchema } from "./schemas";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
} | null;

/** Returns the requested page if it's inside this site, otherwise an empty string. */
function safeCallbackUrl(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value.trim() : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "";
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const blocked = await consumeRateLimit("signupIp", await getClientIp());
  if (blocked) return { error: blocked };

  const parsed = signupSchema.safeParse({
    firstName: formData.get("firstName"),
    email: formData.get("email"),
    mobile: formData.get("mobile"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { firstName, email, mobile, password } = parsed.data;

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { mobile }] },
    select: { email: true },
  });
  if (existing) {
    return {
      error:
        existing.email === email
          ? "An account with this email already exists."
          : "An account with this mobile number already exists.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.user.create({
      data: { firstName, email, mobile, passwordHash, role: "CLIENT" },
    });
  } catch (error) {
    // A concurrent sign-up can pass the check above, so the database
    // unique constraint is the final guard.
    if ((error as { code?: string }).code === "P2002") {
      return { error: "An account with these details already exists." };
    }
    throw error;
  }

  await signIn("credentials", { email, password, redirectTo: "/after-login" });
  return null;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  // Show a clear message before trying. The attempt itself is counted inside authorize.
  const blocked =
    (await peekRateLimit("loginIp", await getClientIp())) ??
    (await peekRateLimit("loginAccount", email));
  if (blocked) return { error: blocked };

  // The after-login page decides the final destination using the role from the server.
  const requested = safeCallbackUrl(formData.get("callbackUrl"));
  const redirectTo = requested
    ? `/after-login?next=${encodeURIComponent(requested)}`
    : "/after-login";

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    // Wrong password, unknown email, or a deactivated account all end up here.
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }
    // A successful signIn throws a redirect. Let Next.js handle it.
    throw error;
  }
  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
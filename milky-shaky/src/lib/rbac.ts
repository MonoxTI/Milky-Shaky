import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AppRole } from "@/types/next-auth";

/** Returns the signed-in user, or redirects to login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Returns the signed-in user if they have the given role, otherwise redirects. */
export async function requireRole(role: AppRole) {
  const user = await requireUser();
  if (user.role !== role) redirect("/order");
  return user;
}
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppRole } from "@/types/next-auth";

/** Returns the signed-in, active user, or redirects to login. */
export async function requireUser(): Promise<{ id: string; name: string; role: AppRole }> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Checked on every protected page, so a deactivated account loses access straight away.
  const current = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, role: true, firstName: true },
  });
  if (!current?.isActive) redirect("/login?reason=inactive");

  return { id: session.user.id, name: current.firstName, role: current.role };
}

/** Returns the signed-in user if they currently have the given role, otherwise redirects. */
export async function requireRole(role: AppRole) {
  const user = await requireUser();
  if (user.role !== role) redirect("/order");
  return user;
}
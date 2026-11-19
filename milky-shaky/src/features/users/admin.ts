import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/features/auth/schemas";
import { recordCreate, recordUpdate } from "@/features/audit/recordChange";
import { db } from "@/lib/db";

export class UserError extends Error {}

export function listUsers() {
  return db.user.findMany({
    orderBy: [{ role: "desc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      email: true,
      mobile: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function createStaffUser(
  actorId: string,
  input: { firstName: string; email: string; mobile: string; password: string; role: Role },
): Promise<void> {
  const parsed = signupSchema.safeParse({
    firstName: input.firstName,
    email: input.email,
    mobile: input.mobile,
    password: input.password,
  });
  if (!parsed.success) {
    throw new UserError(parsed.error.issues[0]?.message ?? "Check the details and try again.");
  }
  const { firstName, email, mobile, password } = parsed.data;

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { mobile }] },
    select: { email: true },
  });
  if (existing) {
    throw new UserError(
      existing.email === email
        ? "An account with this email already exists."
        : "An account with this mobile number already exists.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { firstName, email, mobile, passwordHash, role: input.role },
      });
      // The password hash is never written to the audit trail.
      await recordCreate(tx, {
        entity: "User",
        entityId: user.id,
        actorId,
        snapshot: { firstName, email, mobile, role: input.role, isActive: true },
      });
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw new UserError("An account with these details already exists.");
    }
    throw error;
  }
}

export async function setUserActive(actorId: string, targetId: string, active: boolean): Promise<void> {
  if (!active && targetId === actorId) {
    throw new UserError("You can't deactivate your own account.");
  }

  await db.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, isActive: true },
    });
    if (!before) throw new UserError("That account no longer exists.");
    if (before.isActive === active) return;

    if (!active && before.role === "MANAGER") {
      const otherManagers = await tx.user.count({
        where: { role: "MANAGER", isActive: true, id: { not: targetId } },
      });
      if (otherManagers === 0) {
        throw new UserError("At least one active manager is needed. Create another manager first.");
      }
    }

    const after = await tx.user.update({
      where: { id: targetId },
      data: { isActive: active },
      select: { isActive: true },
    });

    await recordUpdate(tx, {
      entity: "User",
      entityId: targetId,
      actorId,
      before: { isActive: before.isActive },
      after: { isActive: after.isActive },
      fields: ["isActive"],
    });
  });
}
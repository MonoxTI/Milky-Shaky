import { db } from "@/lib/db";
import { recordUpdate } from "@/features/audit/recordChange";
import { validateTierOrdering } from "./rules";

export class DiscountError extends Error {}

export interface TierInput {
  minPriorOrders: number;
  minDrinksPerOrder: number;
  discountPercent: string;
  isActive: boolean;
}

export function listTiers() {
  return db.discountTier.findMany({ orderBy: { level: "asc" } });
}

function auditShape(t: {
  minPriorOrders: number;
  minDrinksPerOrder: number;
  discountPercent: { toString(): string };
  isActive: boolean;
}) {
  return {
    minPriorOrders: t.minPriorOrders,
    minDrinksPerOrder: t.minDrinksPerOrder,
    discountPercent: t.discountPercent.toString(),
    isActive: t.isActive,
  };
}

export async function updateTier(actorId: string, level: number, input: TierInput): Promise<void> {
  await db.$transaction(async (tx) => {
    const before = await tx.discountTier.findUnique({ where: { level } });
    if (!before) throw new DiscountError("That tier doesn't exist.");

    const after = await tx.discountTier.update({ where: { level }, data: input });

    // Check the whole ladder with the change applied. Throwing here rolls the change back.
    const all = await tx.discountTier.findMany({ orderBy: { level: "asc" } });
    const problem = validateTierOrdering(
      all.map((t) => ({
        level: t.level,
        minPriorOrders: t.minPriorOrders,
        minDrinksPerOrder: t.minDrinksPerOrder,
        discountBps: Math.round(Number(t.discountPercent.toString()) * 100),
        isActive: t.isActive,
      })),
    );
    if (problem) throw new DiscountError(problem);

    await recordUpdate(tx, {
      entity: "DiscountTier",
      entityId: String(level),
      actorId,
      before: auditShape(before),
      after: auditShape(after),
      fields: ["minPriorOrders", "minDrinksPerOrder", "discountPercent", "isActive"],
    });
  });
}
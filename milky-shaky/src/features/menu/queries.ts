import { db } from "@/lib/db";

/** Active menu items, in the order the manager set. */
export async function getMenu() {
  const [flavours, consistencies, toppings] = await Promise.all([
    db.flavour.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, priceCents: true },
    }),
    db.consistency.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, priceCents: true },
    }),
    db.topping.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, priceCents: true },
    }),
  ]);

  return { flavours, consistencies, toppings };
}
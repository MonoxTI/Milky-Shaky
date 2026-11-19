import { db } from "@/lib/db";

/** The patron's own orders, newest first. */
export async function getPatronOrders(userId: string, limit = 50) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      reference: true,
      status: true,
      pickupAt: true,
      createdAt: true,
      totalCents: true,
      restaurant: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });
}
import { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getOrderingSettings } from "@/features/settings/service";
import type { DiscountTierRule } from "@/features/discounts/eligibility";
import { percentToBps } from "./pricing";

/** Orders that count towards frequent customer discounts. */
const COUNTED_STATUSES = [OrderStatus.PAID, OrderStatus.COLLECTED];

export async function countCompletedOrders(userId: string): Promise<number> {
  return db.order.count({
    where: { userId, status: { in: COUNTED_STATUSES } },
  });
}

export async function getActiveDiscountTiers(): Promise<DiscountTierRule[]> {
  const tiers = await db.discountTier.findMany({
    where: { isActive: true },
    orderBy: { level: "asc" },
  });
  return tiers.map((t) => ({
    level: t.level,
    minPriorOrders: t.minPriorOrders,
    minDrinksPerOrder: t.minDrinksPerOrder,
    discountBps: percentToBps(t.discountPercent.toString()),
    isActive: t.isActive,
  }));
}

export async function getOrderFormData(userId: string) {
  const [restaurants, flavours, toppings, consistencies, settings, tiers, priorOrders] =
    await Promise.all([
      db.restaurant.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, address: true, opensAt: true, closesAt: true },
      }),
      db.flavour.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, priceCents: true },
      }),
      db.topping.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, priceCents: true },
      }),
      db.consistency.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, priceCents: true },
      }),
      getOrderingSettings(),
      getActiveDiscountTiers(),
      countCompletedOrders(userId),
    ]);

  return { restaurants, flavours, toppings, consistencies, settings, tiers, priorOrders };
}

export async function getOrderForUser(orderId: string, userId: string) {
  return db.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: true,
      restaurant: { select: { name: true, address: true } },
    },
  });
}
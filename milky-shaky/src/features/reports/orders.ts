import { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { DateRange } from "./period";

/** Maximum rows shown on screen. The CSV export has no limit. */
export const ROW_LIMIT = 500;

const PAID_STATUSES: OrderStatus[] = [OrderStatus.PAID, OrderStatus.COLLECTED];

export interface OrdersReportFilters {
  range: DateRange;
  status?: OrderStatus;
}

export function parseOrderStatus(value: string | null | undefined): OrderStatus | undefined {
  return value && (Object.values(OrderStatus) as string[]).includes(value)
    ? (value as OrderStatus)
    : undefined;
}

function buildWhere({ range, status }: OrdersReportFilters) {
  return {
    createdAt: { gte: range.start, lt: range.endExclusive },
    ...(status ? { status } : {}),
  };
}

/**
 * Orders created in the period, plus totals.
 * Pass `limit` as null to return every row (used by the CSV export).
 */
export async function getOrdersReport(filters: OrdersReportFilters, limit: number | null = ROW_LIMIT) {
  const where = buildWhere(filters);

  const [rows, groups] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit ?? undefined,
      select: {
        id: true,
        reference: true,
        status: true,
        pickupAt: true,
        createdAt: true,
        subtotalCents: true,
        discountCents: true,
        vatCents: true,
        totalCents: true,
        user: { select: { firstName: true, email: true } },
        restaurant: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    db.order.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
  ]);

  const totalOrders = groups.reduce((sum, g) => sum + g._count._all, 0);
  const paid = groups.filter((g) => PAID_STATUSES.includes(g.status));
  const paidOrders = paid.reduce((sum, g) => sum + g._count._all, 0);
  const revenueCents = paid.reduce((sum, g) => sum + (g._sum.totalCents ?? 0), 0);

  return {
    rows,
    byStatus: groups
      .map((g) => ({ status: g.status, count: g._count._all }))
      .sort((a, b) => b.count - a.count),
    totals: {
      totalOrders,
      paidOrders,
      revenueCents,
      averageCents: paidOrders > 0 ? Math.round(revenueCents / paidOrders) : 0,
    },
  };
}
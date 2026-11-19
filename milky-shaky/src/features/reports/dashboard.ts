import { OrderStatus } from "@prisma/client";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { db } from "@/lib/db";
import { STORE_TIME_ZONE } from "@/features/orders/pickup";

const PAID_STATUSES = [OrderStatus.PAID, OrderStatus.COLLECTED];

/** Start of the current day in store time, as a UTC Date. */
function startOfStoreDay(now: Date): Date {
  const day = formatInTimeZone(now, STORE_TIME_ZONE, "yyyy-MM-dd");
  return fromZonedTime(`${day}T00:00:00`, STORE_TIME_ZONE);
}

export async function getDashboardSummary(now: Date = new Date()) {
  const todayStart = startOfStoreDay(now);

  const [awaitingPayment, paidToday, revenue, recent] = await Promise.all([
    db.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
    db.order.count({ where: { status: { in: PAID_STATUSES }, paidAt: { gte: todayStart } } }),
    db.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { in: PAID_STATUSES }, paidAt: { gte: todayStart } },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        reference: true,
        status: true,
        totalCents: true,
        pickupAt: true,
        createdAt: true,
        user: { select: { firstName: true } },
        restaurant: { select: { name: true } },
      },
    }),
  ]);

  return {
    awaitingPayment,
    paidToday,
    revenueTodayCents: revenue._sum.totalCents ?? 0,
    recent,
  };
}
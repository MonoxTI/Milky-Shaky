import { OrderStatus } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { db } from "@/lib/db";
import { REPORT_TIME_ZONE, startOfDay } from "./period";

const PAID_STATUSES: OrderStatus[] = [OrderStatus.PAID, OrderStatus.COLLECTED];
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MonthBucket {
  key: string; // "2026-11"
  label: string; // "Nov 26"
}

interface MonthStats {
  label: string;
  orders: number;
  revenueCents: number;
}

/** The last 12 calendar months in store time, oldest first. */
function lastTwelveMonths(now: Date): MonthBucket[] {
  const [year, month] = formatInTimeZone(now, REPORT_TIME_ZONE, "yyyy-MM").split("-").map(Number);
  const current = year * 12 + (month - 1);

  return Array.from({ length: 12 }, (_, i) => {
    const index = current - (11 - i);
    const y = Math.floor(index / 12);
    const m = (index % 12) + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    return {
      key,
      label: formatInTimeZone(startOfDay(`${key}-01`), REPORT_TIME_ZONE, "MMM yy"),
    };
  });
}

export async function getTrends(now: Date = new Date()) {
  const months = lastTwelveMonths(now);
  const since = startOfDay(`${months[0].key}-01`);

  const orders = await db.order.findMany({
    where: { createdAt: { gte: since }, status: { not: OrderStatus.CANCELLED } },
    select: { createdAt: true, status: true, totalCents: true },
  });

  const weekday = WEEKDAY_LABELS.map((label) => ({ label, orders: 0 }));
  const monthly = new Map<string, MonthStats>(
    months.map((m) => [m.key, { label: m.label, orders: 0, revenueCents: 0 }]),
  );

  for (const order of orders) {
    // "i" is the ISO weekday: 1 = Monday ... 7 = Sunday.
    const isoDay = Number(formatInTimeZone(order.createdAt, REPORT_TIME_ZONE, "i"));
    weekday[isoDay - 1].orders += 1;

    const bucket = monthly.get(formatInTimeZone(order.createdAt, REPORT_TIME_ZONE, "yyyy-MM"));
    if (bucket) {
      bucket.orders += 1;
      if (PAID_STATUSES.includes(order.status)) bucket.revenueCents += order.totalCents;
    }
  }

  return { weekday, monthly: [...monthly.values()] };
}
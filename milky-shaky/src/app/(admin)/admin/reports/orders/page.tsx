import Link from "next/link";
import { connection } from "next/server";
import { OrderStatus } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { Suspense } from "react";
import { StatusBadge } from "@/components/order/status-badge";
import { BarList } from "@/components/reports/bar-list";
import { DateRangeForm, fieldClass } from "@/components/reports/date-range-form";
import { StatCard } from "@/components/reports/stat-card";
import { STATUS_LABELS } from "@/features/orders/labels";
import { ROW_LIMIT, getOrdersReport, parseOrderStatus } from "@/features/reports/orders";
import { REPORT_TIME_ZONE, resolveRange } from "@/features/reports/period";
import { formatZAR } from "@/lib/money";
import { requireRole } from "@/lib/rbac";

type Params = Promise<{ from?: string; to?: string; status?: string }>;

export default function OrdersReportPage({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
      <OrdersReportContent searchParams={searchParams} />
    </Suspense>
  );
}

// Reads the session and URL parameters, so it sits inside Suspense (required by cacheComponents).
async function OrdersReportContent({ searchParams }: { searchParams: Params }) {
  await connection();
  await requireRole("MANAGER");

  const { from, to, status } = await searchParams;
  const range = resolveRange(from, to);
  const statusFilter = parseOrderStatus(status);
  const report = await getOrdersReport({ range, status: statusFilter });
  const { totals } = report;

  const exportParams = new URLSearchParams({ from: range.from, to: range.to });
  if (statusFilter) exportParams.set("status", statusFilter);

  return (
    <div className="space-y-6">
      <DateRangeForm
        basePath="/admin/reports/orders"
        from={range.from}
        to={range.to}
        extra={{ status: statusFilter }}
      >
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Status</span>
          <select name="status" defaultValue={statusFilter ?? ""} className={fieldClass}>
            <option value="">All statuses</option>
            {Object.values(OrderStatus).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </DateRangeForm>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders placed" value={String(totals.totalOrders)} accent="bg-sky-400" />
        <StatCard label="Paid orders" value={String(totals.paidOrders)} accent="bg-emerald-500" />
        <StatCard label="Revenue" value={formatZAR(totals.revenueCents)} accent="bg-pink-500" />
        <StatCard label="Average paid order" value={formatZAR(totals.averageCents)} accent="bg-amber-400" />
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">By status</h2>
        {report.byStatus.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders in this period.</p>
        ) : (
          <BarList
            items={report.byStatus.map((s) => ({ label: STATUS_LABELS[s.status], value: s.count }))}
          />
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-semibold">Orders</h2>
          <Link
            href={`/api/reports/orders?${exportParams.toString()}`}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium transition hover:border-primary hover:text-primary"
          >
            Export CSV
          </Link>
        </div>

        {report.rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No orders match these filters.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Placed</th>
                  <th className="px-4 py-3 font-medium">Patron</th>
                  <th className="px-4 py-3 font-medium">Restaurant</th>
                  <th className="px-4 py-3 font-medium">Pickup</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((order) => (
                  <tr key={order.id} className="border-t border-border transition hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs">{order.reference}</td>
                    <td className="px-4 py-3">
                      {formatInTimeZone(order.createdAt, REPORT_TIME_ZONE, "d MMM yyyy, HH:mm")}
                    </td>
                    <td className="px-4 py-3">{order.user.firstName}</td>
                    <td className="px-4 py-3">{order.restaurant.name}</td>
                    <td className="px-4 py-3">
                      {formatInTimeZone(order.pickupAt, REPORT_TIME_ZONE, "d MMM, HH:mm")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatZAR(order.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {report.rows.length === ROW_LIMIT && (
          <p className="text-xs text-muted-foreground">
            Showing the latest {ROW_LIMIT} orders. Export CSV for the full list.
          </p>
        )}
      </section>
    </div>
  );
}
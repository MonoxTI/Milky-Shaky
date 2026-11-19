import { connection } from "next/server";
import { Suspense } from "react";
import { BarList } from "@/components/reports/bar-list";
import { ColumnChart } from "@/components/reports/column-chart";
import { StatCard } from "@/components/reports/stat-card";
import { getTrends } from "@/features/reports/trends";
import { formatZAR } from "@/lib/money";
import { requireRole } from "@/lib/rbac";

export default function TrendsReportPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
      <TrendsContent />
    </Suspense>
  );
}

// Reads the session and live data, so it sits inside Suspense (required by cacheComponents).
async function TrendsContent() {
  await connection();
  await requireRole("MANAGER");
  const trends = await getTrends();

  const totalOrders = trends.monthly.reduce((sum, m) => sum + m.orders, 0);
  const totalRevenue = trends.monthly.reduce((sum, m) => sum + m.revenueCents, 0);
  const busiest = [...trends.weekday].sort((a, b) => b.orders - a.orders)[0];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Orders, last 12 months" value={String(totalOrders)} accent="bg-sky-400" />
        <StatCard label="Paid revenue, last 12 months" value={formatZAR(totalRevenue)} accent="bg-pink-500" />
      </section>

      <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="font-semibold">Orders per month</h2>
          <p className="text-sm text-muted-foreground">Orders placed each month, excluding cancelled orders.</p>
        </div>
        <ColumnChart items={trends.monthly.map((m) => ({ label: m.label, value: m.orders }))} />
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="font-semibold">Orders by day of the week</h2>
          <p className="text-sm text-muted-foreground">Based on the last 12 months, in South African time.</p>
        </div>
        {busiest.orders > 0 && (
          <p className="text-sm">
            Busiest day: <span className="font-semibold">{busiest.label}</span> with {busiest.orders} orders.
          </p>
        )}
        <BarList items={trends.weekday.map((d) => ({ label: d.label, value: d.orders }))} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 text-right font-medium">Orders</th>
              <th className="px-4 py-3 text-right font-medium">Paid revenue</th>
            </tr>
          </thead>
          <tbody>
            {trends.monthly.map((m) => (
              <tr key={m.label} className="border-t border-border">
                <td className="px-4 py-3">{m.label}</td>
                <td className="px-4 py-3 text-right tabular-nums">{m.orders}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatZAR(m.revenueCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
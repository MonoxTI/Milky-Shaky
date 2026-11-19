import { connection } from "next/server";
import { Suspense } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { StatusBadge } from "@/components/order/status-badge";
import { getDashboardSummary } from "@/features/reports/dashboard";
import { STORE_TIME_ZONE } from "@/features/orders/pickup";
import { formatZAR } from "@/lib/money";
import { requireRole } from "@/lib/rbac";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Management</p>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Today's figures reset at midnight, South African time.</p>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

// Marks this section as request-time, which cacheComponents requires for session and live data.
async function DashboardContent() {
  await connection();
  await requireRole("MANAGER");
  const summary = await getDashboardSummary();

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting payment" value={String(summary.awaitingPayment)} accent="bg-amber-400" />
        <StatCard label="Paid today" value={String(summary.paidToday)} accent="bg-emerald-500" />
        <StatCard label="Revenue today" value={formatZAR(summary.revenueTodayCents)} accent="bg-pink-500" />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Recent orders</h2>
        {summary.recent.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Patron</th>
                  <th className="px-4 py-3 font-medium">Restaurant</th>
                  <th className="px-4 py-3 font-medium">Pickup</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent.map((order) => (
                  <tr key={order.id} className="border-t border-border transition hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs">{order.reference}</td>
                    <td className="px-4 py-3">{order.user.firstName}</td>
                    <td className="px-4 py-3">{order.restaurant.name}</td>
                    <td className="px-4 py-3">
                      {formatInTimeZone(order.pickupAt, STORE_TIME_ZONE, "d MMM, HH:mm")}
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
      </section>

      <p className="text-xs text-muted-foreground">
        Lookup management, settings, discounts, full reports and the audit trail are added in the next phases.
      </p>
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className={`mb-4 h-1 w-10 rounded-full ${accent}`} />
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
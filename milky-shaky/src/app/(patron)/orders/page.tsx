import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { StatusBadge } from "@/components/order/status-badge";
import { getPatronOrders } from "@/features/orders/history";
import { STORE_TIME_ZONE } from "@/features/orders/pickup";
import { formatZAR } from "@/lib/money";
import { requireUser } from "@/lib/rbac";

export default function MyOrdersPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your account</p>
          <h1 className="text-3xl font-bold tracking-tight">My orders</h1>
          <p className="text-sm text-muted-foreground">Track payments and pickup times.</p>
        </div>
        <Link
          href="/order"
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Order a milkshake
        </Link>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" />}>
        <OrdersList />
      </Suspense>
    </main>
  );
}

// Reads the session and this patron's orders, so it sits inside Suspense (required by cacheComponents).
async function OrdersList() {
  await connection();
  const user = await requireUser();
  const orders = await getPatronOrders(user.id);

  if (orders.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-dashed border-border p-10 text-center">
        <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>
        <Link href="/order" className="font-medium text-primary underline">
          Build your first milkshake
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/orders/${order.id}`}
            className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold">{order.reference}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order._count.items} drink{order._count.items === 1 ? "" : "s"} · {order.restaurant.name}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Pickup {formatInTimeZone(order.pickupAt, STORE_TIME_ZONE, "EEE d MMM, HH:mm")}
              </span>
              <span className="font-semibold">{formatZAR(order.totalCents)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
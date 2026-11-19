import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { PayButton } from "@/components/payments/pay-button";
import { StatusBadge } from "@/components/order/status-badge";
import { getOrderForUser } from "@/features/orders/queries";
import { STORE_TIME_ZONE } from "@/features/orders/pickup";
import { formatZAR } from "@/lib/money";
import { requireUser } from "@/lib/rbac";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <OrderDetail params={params} />
      </Suspense>
    </main>
  );
}

async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const user = await requireUser();
  const order = await getOrderForUser(id, user.id);

  // Returns 404 for other patrons' orders too, so IDs can't be guessed.
  if (!order) notFound();

  const payable = order.status === "PENDING_PAYMENT" || order.status === "PAYMENT_FAILED";

  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your order</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{order.reference}</h1>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Restaurant" value={`${order.restaurant.name}, ${order.restaurant.address}`} />
        <InfoCard
          label="Pickup"
          value={formatInTimeZone(order.pickupAt, STORE_TIME_ZONE, "EEE d MMM yyyy, HH:mm")}
        />
        {order.paidAt && (
          <InfoCard
            label="Paid"
            value={formatInTimeZone(order.paidAt, STORE_TIME_ZONE, "EEE d MMM yyyy, HH:mm")}
          />
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">Drinks</h2>
        <ul className="mt-3 divide-y divide-border">
          {order.items.map((item, i) => (
            <li key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm">
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{item.flavourName}</p>
                  <p className="text-muted-foreground">
                    {item.consistencyName} · {item.toppingName}
                  </p>
                </div>
              </div>
              <span className="font-medium">{formatZAR(item.unitPriceCents)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 rounded-2xl border border-border bg-card p-6 text-sm shadow-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatZAR(order.subtotalCents)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Discount</span>
          <span>{formatZAR(order.discountCents)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>VAT ({order.vatPercent.toString()}%)</span>
          <span>{formatZAR(order.vatCents)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
          <span>Total</span>
          <span>{formatZAR(order.totalCents)}</span>
        </div>
      </section>

      {payable && (
        <section className="space-y-3 rounded-2xl border border-primary/20 bg-secondary/40 p-6">
          {order.status === "PAYMENT_FAILED" ? (
            <p className="text-sm font-medium text-destructive">Your last payment didn&apos;t go through.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Pay now to confirm your order.</p>
          )}
          <PayButton
            orderId={order.id}
            label={order.status === "PAYMENT_FAILED" ? "Try payment again" : "Pay now"}
          />
        </section>
      )}
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
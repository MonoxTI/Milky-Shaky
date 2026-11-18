import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { PayButton } from "@/components/payments/pay-button";
import { getOrderForUser } from "@/features/orders/queries";
import { STORE_TIME_ZONE } from "@/features/orders/pickup";
import { formatZAR } from "@/lib/money";
import { requireUser } from "@/lib/rbac";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  PAYMENT_FAILED: "Payment failed",
  CANCELLED: "Cancelled",
  COLLECTED: "Collected",
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <Suspense fallback={<p className="text-muted-foreground">Loading your order...</p>}>
        <OrderDetail params={params} />
      </Suspense>
    </main>
  );
}

async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const order = await getOrderForUser(id, user.id);

  // Returns 404 for other patrons' orders too, so IDs can't be guessed.
  if (!order) notFound();

  const payable = order.status === "PENDING_PAYMENT" || order.status === "PAYMENT_FAILED";

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Order {order.reference}</h1>
        <p className="text-muted-foreground">Status: {STATUS_LABELS[order.status] ?? order.status}</p>
      </div>

      <section className="space-y-1 text-sm">
        <p>
          <span className="font-medium">Restaurant:</span> {order.restaurant.name}, {order.restaurant.address}
        </p>
        <p>
          <span className="font-medium">Pickup:</span>{" "}
          {formatInTimeZone(order.pickupAt, STORE_TIME_ZONE, "EEE d MMM yyyy, HH:mm")}
        </p>
        {order.paidAt && (
          <p>
            <span className="font-medium">Paid:</span>{" "}
            {formatInTimeZone(order.paidAt, STORE_TIME_ZONE, "EEE d MMM yyyy, HH:mm")}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Drinks</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((item, i) => (
            <li key={item.id} className="flex justify-between rounded border p-3">
              <span>
                {i + 1}. {item.flavourName} · {item.consistencyName} · {item.toppingName}
              </span>
              <span>{formatZAR(item.unitPriceCents)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-1 border-t pt-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatZAR(order.subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount</span>
          <span>{formatZAR(order.discountCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT ({order.vatPercent.toString()}%)</span>
          <span>{formatZAR(order.vatCents)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatZAR(order.totalCents)}</span>
        </div>
      </section>

      {payable && (
        <section className="space-y-2">
          {order.status === "PAYMENT_FAILED" && (
            <p className="text-sm text-destructive">Your last payment didn&apos;t go through.</p>
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
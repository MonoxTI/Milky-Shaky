import { connection } from "next/server";
import { Suspense } from "react";
import { OrderForm } from "@/components/order/order-form";
import { getOrderFormData } from "@/features/orders/queries";
import { requireUser } from "@/lib/rbac";

export default function OrderPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Order online</p>
        <h1 className="text-3xl font-bold tracking-tight">Build your milkshakes</h1>
        <p className="text-muted-foreground">
          Pick your drinks, a restaurant and a pickup time. Your order is confirmed once you've paid.
        </p>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <OrderPageContent />
      </Suspense>
    </main>
  );
}

// Marks this section as request-time, which cacheComponents requires for per-user data.
async function OrderPageContent() {
  await connection();
  const user = await requireUser();
  const data = await getOrderFormData(user.id);
  return <OrderForm {...data} />;
}
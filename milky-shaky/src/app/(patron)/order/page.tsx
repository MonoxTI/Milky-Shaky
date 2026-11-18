import { Suspense } from "react";
import { OrderForm } from "@/components/order/order-form";
import { getOrderFormData } from "@/features/orders/queries";
import { requireUser } from "@/lib/rbac";

export default function OrderPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Order your milkshakes</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading the menu...</p>}>
        <OrderPageContent />
      </Suspense>
    </main>
  );
}

// Reads the session and database, so it sits inside Suspense (required by cacheComponents).
async function OrderPageContent() {
  const user = await requireUser();
  const data = await getOrderFormData(user.id);
  return <OrderForm {...data} />;
}
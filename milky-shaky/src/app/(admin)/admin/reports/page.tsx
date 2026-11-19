import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function ReportsIndexPage() {
  return (
    <Suspense fallback={null}>
      <RedirectToOrders />
    </Suspense>
  );
}

// Reads request-time data before redirecting, so it sits inside Suspense (required by cacheComponents).
async function RedirectToOrders(): Promise<never> {
  await connection();
  redirect("/admin/reports/orders");
}
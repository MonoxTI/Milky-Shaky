import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function LookupsIndexPage() {
  return (
    <Suspense fallback={null}>
      <RedirectToFlavours />
    </Suspense>
  );
}

// Reads request-time data before redirecting, so it sits inside Suspense (required by cacheComponents).
async function RedirectToFlavours(): Promise<never> {
  await connection();
  redirect("/admin/lookups/flavour");
}
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ActiveBadge, Field, inputClass, panelClass, primaryButtonClass } from "@/components/admin/ui";
import { FlashMessage } from "@/components/layout/flash-message";
import { listTiers } from "@/features/discounts/admin";
import { updateTierAction } from "@/features/discounts/actions";
import { requireRole } from "@/lib/rbac";

type Search = Promise<{ notice?: string; error?: string }>;

export default function DiscountsPage({ searchParams }: { searchParams: Search }) {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Management</p>
        <h1 className="text-3xl font-bold tracking-tight">Frequent customer discounts</h1>
        <p className="text-sm text-muted-foreground">
          Patrons get the highest tier they qualify for. Tiers must rise together, so a higher tier can't be easier to
          reach or worth less. The maximum discount per order is set in{" "}
          <Link href="/admin/settings" className="font-medium text-primary underline">
            Settings
          </Link>
          .
        </p>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <TiersContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Reads the session and live data, so it sits inside Suspense (required by cacheComponents).
async function TiersContent({ searchParams }: { searchParams: Search }) {
  await connection();
  await requireRole("MANAGER");

  const flash = await searchParams;
  const tiers = await listTiers();

  return (
    <>
      <FlashMessage notice={flash.notice} error={flash.error} />
      {tiers.map((t) => {
        const percent = Number(t.discountPercent.toString()).toFixed(2);
        return (
          <form key={t.level} action={updateTierAction} className={`${panelClass} space-y-5`}>
            <input type="hidden" name="level" value={t.level} />
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold">Tier {t.level}</p>
                <p className="text-sm text-muted-foreground">
                  Patrons with {t.minPriorOrders} or more previous orders who order {t.minDrinksPerOrder} or more
                  drinks get {percent}% off.
                </p>
              </div>
              <ActiveBadge active={t.isActive} activeText="On" inactiveText="Off" />
            </div>
            <div className="grid gap-4 sm:grid-cols-4 sm:items-end">
              <Field label="Previous orders">
                <input name="minPriorOrders" inputMode="numeric" defaultValue={t.minPriorOrders} className={inputClass} />
              </Field>
              <Field label="Drinks per order">
                <input name="minDrinksPerOrder" inputMode="numeric" defaultValue={t.minDrinksPerOrder} className={inputClass} />
              </Field>
              <Field label="Discount (%)">
                <input name="discountPercent" inputMode="decimal" defaultValue={percent} className={inputClass} />
              </Field>
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={t.isActive} className="size-4" /> Active
                </label>
                <button type="submit" className={primaryButtonClass}>
                  Save
                </button>
              </div>
            </div>
          </form>
        );
      })}
    </>
  );
}
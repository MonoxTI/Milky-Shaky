import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SectionTabs } from "@/components/admin/section-tabs";
import { ActiveBadge, Field, inputClass, panelClass, primaryButtonClass, secondaryButtonClass } from "@/components/admin/ui";
import { FlashMessage } from "@/components/layout/flash-message";
import { createLookupAction, toggleLookupAction, updateLookupAction } from "@/features/lookups/actions";
import { LOOKUP_TYPES, isLookupType, type LookupType } from "@/features/lookups/config";
import { listLookups } from "@/features/lookups/service";
import { formatZAR } from "@/lib/money";
import { requireRole } from "@/lib/rbac";

type Params = Promise<{ type: string }>;
type Search = Promise<{ notice?: string; error?: string }>;

const LOOKUP_TABS = (Object.keys(LOOKUP_TYPES) as LookupType[]).map((type) => ({
  href: `/admin/lookups/${type}`,
  label: LOOKUP_TYPES[type].label,
}));

export default function LookupsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <LookupsContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Reads the session and live data, so it sits inside Suspense (required by cacheComponents).
async function LookupsContent({ params, searchParams }: { params: Params; searchParams: Search }) {
  await connection();
  await requireRole("MANAGER");

  const { type } = await params;
  if (!isLookupType(type)) notFound();

  const flash = await searchParams;
  const rows = await listLookups(type);
  const config = LOOKUP_TYPES[type];

  return (
    <>
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Lookups</p>
        <h1 className="text-3xl font-bold tracking-tight">{config.label}</h1>
        <p className="text-sm text-muted-foreground">
          Prices are added to each drink. Changes apply to new orders only. Hidden items stay on past orders.
        </p>
      </div>

      <SectionTabs items={LOOKUP_TABS} />
      <FlashMessage notice={flash.notice} error={flash.error} />

      <form action={createLookupAction} className={`${panelClass} grid gap-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end`}>
        <input type="hidden" name="type" value={type} />
        <Field label="Name">
          <input name="name" required maxLength={60} className={inputClass} />
        </Field>
        <Field label="Price (R)">
          <input name="price" inputMode="decimal" placeholder="0.00" required className={inputClass} />
        </Field>
        <Field label="Display order">
          <input name="sortOrder" type="number" min={0} max={999} defaultValue={rows.length + 1} className={inputClass} />
        </Field>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked className="size-4" /> Active
          </label>
          <button type="submit" className={primaryButtonClass}>
            Add {config.singular}
          </button>
        </div>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No {config.label.toLowerCase()} yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Edit</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.priceCents === 0 ? "Included" : formatZAR(row.priceCents)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{row.sortOrder}</td>
                  <td className="px-4 py-3">
                    <ActiveBadge active={row.isActive} activeText="Active" inactiveText="Hidden" />
                  </td>
                  <td className="px-4 py-3">
                    <details>
                      <summary className={`${secondaryButtonClass} cursor-pointer list-none`}>Edit</summary>
                      <form
                        action={updateLookupAction}
                        className="mt-3 grid gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2"
                      >
                        <input type="hidden" name="type" value={type} />
                        <input type="hidden" name="id" value={row.id} />
                        <Field label="Name">
                          <input name="name" defaultValue={row.name} required maxLength={60} className={inputClass} />
                        </Field>
                        <Field label="Price (R)">
                          <input
                            name="price"
                            defaultValue={(row.priceCents / 100).toFixed(2)}
                            inputMode="decimal"
                            required
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Display order">
                          <input
                            name="sortOrder"
                            type="number"
                            min={0}
                            max={999}
                            defaultValue={row.sortOrder}
                            className={inputClass}
                          />
                        </Field>
                        <div className="flex items-end justify-between gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="isActive" defaultChecked={row.isActive} className="size-4" />
                            Active
                          </label>
                          <button type="submit" className={primaryButtonClass}>
                            Save
                          </button>
                        </div>
                      </form>
                    </details>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleLookupAction}>
                      <input type="hidden" name="type" value={type} />
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="active" value={row.isActive ? "false" : "true"} />
                      <button type="submit" className={secondaryButtonClass}>
                        {row.isActive ? "Hide" : "Show"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
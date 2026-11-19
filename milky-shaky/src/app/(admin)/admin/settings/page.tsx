import { connection } from "next/server";
import { Suspense } from "react";
import { Field, inputClass, panelClass, primaryButtonClass } from "@/components/admin/ui";
import { FlashMessage } from "@/components/layout/flash-message";
import { listSettings } from "@/features/settings/admin";
import { updateSettingAction } from "@/features/settings/actions";
import { SETTING_DEFINITIONS, displayValue, inputValue } from "@/features/settings/definitions";
import { requireRole } from "@/lib/rbac";

type Search = Promise<{ notice?: string; error?: string }>;

export default function SettingsPage({ searchParams }: { searchParams: Search }) {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Management</p>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Fixed values used when placing orders. Every change is recorded in the audit trail.
        </p>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <SettingsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Reads the session and live data, so it sits inside Suspense (required by cacheComponents).
async function SettingsContent({ searchParams }: { searchParams: Search }) {
  await connection();
  await requireRole("MANAGER");

  const flash = await searchParams;
  const values = await listSettings();

  return (
    <>
      <FlashMessage notice={flash.notice} error={flash.error} />
      <div className="space-y-4">
        {SETTING_DEFINITIONS.map((def) => {
          const stored = values.get(def.key);
          return (
            <form
              key={def.key}
              action={updateSettingAction}
              className={`${panelClass} grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end`}
            >
              <input type="hidden" name="key" value={def.key} />
              <div className="space-y-1">
                <p className="font-semibold">{def.label}</p>
                <p className="text-sm text-muted-foreground">{def.help}</p>
                <p className="text-xs text-muted-foreground">
                  Current value:{" "}
                  <span className="font-medium text-foreground">
                    {stored === undefined ? "Not set" : displayValue(def, stored)}
                  </span>
                </p>
              </div>
              <div className="flex items-end gap-3">
                <Field label={def.kind === "rands" ? "New amount (R)" : "New value"}>
                  <input
                    name="value"
                    required
                    defaultValue={stored === undefined ? "" : inputValue(def, stored)}
                    className={`${inputClass} w-36`}
                  />
                </Field>
                <button type="submit" className={primaryButtonClass}>
                  Save
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </>
  );
}
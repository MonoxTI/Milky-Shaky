import type { ReactNode } from "react";

export const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export const primaryButtonClass =
  "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90";
export const secondaryButtonClass =
  "inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full border border-border bg-card px-3 text-xs font-medium transition hover:border-primary hover:text-primary";
export const panelClass = "rounded-2xl border border-border bg-card p-6 shadow-sm";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="block font-medium">{label}</span>
      {children}
    </label>
  );
}

export function ActiveBadge({
  active,
  activeText = "Active",
  inactiveText = "Inactive",
}: {
  active: boolean;
  activeText?: string;
  inactiveText?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        active ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-stone-100 text-stone-600 ring-stone-200"
      }`}
    >
      {active ? activeText : inactiveText}
    </span>
  );
}
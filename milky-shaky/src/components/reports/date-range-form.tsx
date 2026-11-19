import Link from "next/link";
import type { ReactNode } from "react";
import { presetRanges } from "@/features/reports/period";

export const fieldClass =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const chipClass =
  "rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary";

export function DateRangeForm({
  basePath,
  from,
  to,
  extra = {},
  children,
}: {
  basePath: string;
  from: string;
  to: string;
  extra?: Record<string, string | undefined>;
  children?: ReactNode;
}) {
  // Preset links keep the other filters that are currently applied.
  const presetHref = (range: { from: string; to: string }) => {
    const params = new URLSearchParams({ from: range.from, to: range.to });
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value);
    }
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {presetRanges().map((preset) => (
          <Link key={preset.label} href={presetHref(preset)} className={chipClass}>
            {preset.label}
          </Link>
        ))}
      </div>

      <form method="get" action={basePath} className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">From</span>
          <input type="date" name="from" defaultValue={from} className={fieldClass} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">To</span>
          <input type="date" name="to" defaultValue={to} className={fieldClass} />
        </label>
        {children}
        <button
          type="submit"
          className="h-9 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
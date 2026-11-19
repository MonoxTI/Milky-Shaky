import Link from "next/link";
import { connection } from "next/server";
import { formatInTimeZone } from "date-fns-tz";
import { Suspense } from "react";
import { DateRangeForm, fieldClass } from "@/components/reports/date-range-form";
import { getAuditReport } from "@/features/reports/audit";
import { REPORT_TIME_ZONE, resolveRange } from "@/features/reports/period";
import { requireRole } from "@/lib/rbac";

type Params = Promise<{ from?: string; to?: string; entity?: string; actor?: string; page?: string }>;

const pagerClass =
  "rounded-full border border-border px-4 py-1.5 text-sm font-medium transition hover:border-primary hover:text-primary";

export default function AuditReportPage({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
      <AuditContent searchParams={searchParams} />
    </Suspense>
  );
}

// Reads the session and URL parameters, so it sits inside Suspense (required by cacheComponents).
async function AuditContent({ searchParams }: { searchParams: Params }) {
  await connection();
  await requireRole("MANAGER");

  const { from, to, entity, actor, page } = await searchParams;
  const range = resolveRange(from, to);
  const pageNumber = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);

  const report = await getAuditReport({
    range,
    entity: entity || undefined,
    actorId: actor || undefined,
    page: pageNumber,
  });

  function pageHref(target: number) {
    const params = new URLSearchParams({ from: range.from, to: range.to, page: String(target) });
    if (entity) params.set("entity", entity);
    if (actor) params.set("actor", actor);
    return `/admin/reports/audit?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Every change to managed records is listed here with who made it and the before and after values.
        Currently this covers order status changes. Lookup and settings changes appear once those screens are built.
      </p>

      <DateRangeForm
        basePath="/admin/reports/audit"
        from={range.from}
        to={range.to}
        extra={{ entity, actor }}
      >
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Record type</span>
          <select name="entity" defaultValue={entity ?? ""} className={fieldClass}>
            <option value="">All records</option>
            {report.entities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Changed by</span>
          <select name="actor" defaultValue={actor ?? ""} className={fieldClass}>
            <option value="">Anyone</option>
            {report.managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName}
              </option>
            ))}
          </select>
        </label>
      </DateRangeForm>

      {report.rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No changes match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Changed by</th>
                <th className="px-4 py-3 font-medium">Record</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Field</th>
                <th className="px-4 py-3 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatInTimeZone(row.createdAt, REPORT_TIME_ZONE, "d MMM yyyy, HH:mm:ss")}
                  </td>
                  <td className="px-4 py-3">{row.actor?.firstName ?? "System"}</td>
                  <td className="px-4 py-3">
                    <span className="block">{row.entity}</span>
                    <span className="font-mono text-xs text-muted-foreground">{row.entityId.slice(-8)}</span>
                  </td>
                  <td className="px-4 py-3">{row.action}</td>
                  <td className="px-4 py-3">{row.field ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">{formatValue(row.oldValue)}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{formatValue(row.newValue)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {pageNumber} of {report.pageCount} · {report.total} entries
        </span>
        <div className="flex gap-2">
          {pageNumber > 1 && (
            <Link href={pageHref(pageNumber - 1)} className={pagerClass}>
              Previous
            </Link>
          )}
          {pageNumber < report.pageCount && (
            <Link href={pageHref(pageNumber + 1)} className={pagerClass}>
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
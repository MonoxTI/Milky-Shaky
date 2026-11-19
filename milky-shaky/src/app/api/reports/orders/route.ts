import { formatInTimeZone } from "date-fns-tz";
import { auth } from "@/lib/auth";
import { STATUS_LABELS } from "@/features/orders/labels";
import { getOrdersReport, parseOrderStatus } from "@/features/reports/orders";
import { REPORT_TIME_ZONE, resolveRange } from "@/features/reports/period";
import { consumeRateLimit } from "@/features/security/rate-limit";

const HEADERS = [
  "Reference",
  "Placed",
  "Patron",
  "Email",
  "Restaurant",
  "Pickup",
  "Items",
  "Status",
  "Subtotal (R)",
  "Discount (R)",
  "VAT (R)",
  "Total (R)",
];

/** Quotes a CSV cell when it contains a comma, quote or line break. */
function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rands(cents: number): string {
  return (cents / 100).toFixed(2);
}

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "MANAGER") {
    return new Response("Forbidden", { status: 403 });
  }

  const blocked = await consumeRateLimit("exportUser", session.user.id);
  if (blocked) {
    return new Response(blocked, { status: 429, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const url = new URL(request.url);
  const range = resolveRange(url.searchParams.get("from") ?? undefined, url.searchParams.get("to") ?? undefined);
  const status = parseOrderStatus(url.searchParams.get("status"));

  // null means no row limit, so the export contains every matching order.
  const report = await getOrdersReport({ range, status }, null);

  const lines = [
    HEADERS.join(","),
    ...report.rows.map((r) =>
      [
        r.reference,
        formatInTimeZone(r.createdAt, REPORT_TIME_ZONE, "yyyy-MM-dd HH:mm"),
        r.user.firstName,
        r.user.email,
        r.restaurant.name,
        formatInTimeZone(r.pickupAt, REPORT_TIME_ZONE, "yyyy-MM-dd HH:mm"),
        r._count.items,
        STATUS_LABELS[r.status] ?? r.status,
        rands(r.subtotalCents),
        rands(r.discountCents),
        rands(r.vatCents),
        rands(r.totalCents),
      ]
        .map(csvCell)
        .join(","),
    ),
  ];

  // The byte order mark (\uFEFF) makes Excel read the file as UTF-8.
  return new Response("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${range.from}-to-${range.to}.csv"`,
    },
  });
}
const STYLES: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  PAID: { label: "Paid", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  PAYMENT_FAILED: { label: "Payment failed", className: "bg-red-50 text-red-700 ring-red-200" },
  CANCELLED: { label: "Cancelled", className: "bg-stone-100 text-stone-600 ring-stone-200" },
  COLLECTED: { label: "Collected", className: "bg-sky-50 text-sky-800 ring-sky-200" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? { label: status, className: "bg-muted text-muted-foreground ring-border" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style.className}`}
    >
      {style.label}
    </span>
  );
}
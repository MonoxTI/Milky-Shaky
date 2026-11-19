// All money is handled as integer cents. Never use floating point for currency.

export function toCents(rands: string | number): number {
  const value = typeof rands === "string" ? Number(rands) : rands;
  return Math.round(value * 100);
}

/** Formats cents as South African rand, e.g. 1500 -> "R15.00". */
export function formatZAR(cents: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

/** Parses "15", "15.5" or "15.50" into cents without rounding errors. Returns null if invalid. */
export function parseRandsToCents(value: string): number | null {
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const rands = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  return rands * 100 + cents;
}
export function toCents(rands: string | number): number {
  const value = typeof rands === "string" ? Number(rands) : rands;
  return Math.round(value * 100);
}

export function formatZAR(cents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(cents / 100);
}
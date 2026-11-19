export interface TierRule {
  level: number;
  minPriorOrders: number;
  minDrinksPerOrder: number;
  discountBps: number;
  isActive: boolean;
}

/**
 * Tiers must rise together: a higher tier can't need fewer orders or drinks,
 * and can't give a smaller discount. Returns an error message, or null if valid.
 */
export function validateTierOrdering(tiers: TierRule[]): string | null {
  const active = tiers.filter((t) => t.isActive).sort((a, b) => a.level - b.level);

  for (let i = 1; i < active.length; i++) {
    const lower = active[i - 1];
    const higher = active[i];
    if (higher.minPriorOrders < lower.minPriorOrders) {
      return `Tier ${higher.level} needs fewer previous orders than tier ${lower.level}.`;
    }
    if (higher.minDrinksPerOrder < lower.minDrinksPerOrder) {
      return `Tier ${higher.level} needs fewer drinks per order than tier ${lower.level}.`;
    }
    if (higher.discountBps < lower.discountBps) {
      return `Tier ${higher.level} gives a smaller discount than tier ${lower.level}.`;
    }
  }
  return null;
}

export type TierParse =
  | { ok: true; minPriorOrders: number; minDrinksPerOrder: number; discountPercent: string; isActive: boolean }
  | { ok: false; error: string };

export function parseTierInput(input: {
  minPriorOrders: string;
  minDrinksPerOrder: string;
  discountPercent: string;
  isActive: boolean;
}): TierParse {
  const orders = input.minPriorOrders.trim();
  const drinks = input.minDrinksPerOrder.trim();
  const percent = input.discountPercent.trim();

  if (!/^\d{1,4}$/.test(orders)) return { ok: false, error: "Previous orders must be a whole number from 0 to 9999." };
  if (!/^\d{1,2}$/.test(drinks) || Number(drinks) < 1 || Number(drinks) > 50) {
    return { ok: false, error: "Drinks per order must be a whole number from 1 to 50." };
  }
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(percent) || Number(percent) > 100) {
    return { ok: false, error: "Discount must be a percentage from 0 to 100." };
  }

  return {
    ok: true,
    minPriorOrders: Number(orders),
    minDrinksPerOrder: Number(drinks),
    discountPercent: String(Number(percent)),
    isActive: input.isActive,
  };
}
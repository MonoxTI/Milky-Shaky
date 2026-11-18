// Frequent customer discount rules (spec section 3.4.5).
// A patron qualifies for a tier when they have enough prior orders AND the
// current order has enough drinks. The highest qualifying tier applies.

export interface DiscountTierRule {
  level: number;
  minPriorOrders: number;
  minDrinksPerOrder: number;
  discountBps: number;
  isActive: boolean;
}

/**
 * Returns the discount rate (basis points) for this patron and order.
 * Returns 0 when no active tier is met.
 */
export function resolveDiscountBps(
  priorOrders: number,
  drinksInOrder: number,
  tiers: DiscountTierRule[],
): number {
  const qualifying = tiers
    .filter((t) => t.isActive)
    .filter((t) => priorOrders >= t.minPriorOrders && drinksInOrder >= t.minDrinksPerOrder)
    .sort((a, b) => b.level - a.level);

  return qualifying.length > 0 ? qualifying[0].discountBps : 0;
}
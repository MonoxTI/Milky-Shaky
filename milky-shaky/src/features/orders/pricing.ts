// Pricing engine. Pure functions only: no database access, so they are easy to test.
// All money is integer cents. All percentages are integer basis points (1500 = 15%).

export const BPS_DIVISOR = 10_000;

/** Converts a percentage such as 15 or "7.50" to basis points. */
export function percentToBps(percent: number | string): number {
  const value = typeof percent === "string" ? Number(percent) : percent;
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`Invalid percentage: ${percent}`);
  }
  return Math.round(value * 100);
}

/**
 * Applies a basis-point rate to an amount in cents, rounding half up to the nearest cent.
 * Inputs must be non-negative integers.
 */
export function applyBps(amountCents: number, bps: number): number {
  return Math.floor((amountCents * bps + BPS_DIVISOR / 2) / BPS_DIVISOR);
}

export interface DrinkPriceInput {
  flavourPriceCents: number;
  toppingPriceCents: number;
  consistencyPriceCents: number;
}

/** Price of a single drink: flavour + topping + consistency. */
export function priceDrink(input: DrinkPriceInput): number {
  const parts = [input.flavourPriceCents, input.toppingPriceCents, input.consistencyPriceCents];
  for (const p of parts) {
    if (!Number.isInteger(p) || p < 0) {
      throw new Error(`Invalid price in cents: ${p}`);
    }
  }
  return parts[0] + parts[1] + parts[2];
}

export interface OrderTotalsInput {
  drinkPricesCents: number[];
  discountBps: number;
  maxDiscountCents: number;
  vatBps: number;
}

export interface OrderTotals {
  subtotalCents: number;
  discountBps: number;
  discountCents: number;
  taxableCents: number;
  vatBps: number;
  vatCents: number;
  totalCents: number;
}

/**
 * Order total calculation:
 *   subtotal  = sum of drink prices (VAT excluded, as in the spec's example)
 *   discount  = subtotal x discount rate, capped at maxDiscountCents
 *   taxable   = subtotal - discount
 *   VAT       = taxable x VAT rate
 *   total     = taxable + VAT
 */
export function calculateOrderTotals(input: OrderTotalsInput): OrderTotals {
  const { drinkPricesCents, discountBps, maxDiscountCents, vatBps } = input;

  if (drinkPricesCents.length === 0) {
    throw new Error("An order must contain at least one drink.");
  }
  for (const p of drinkPricesCents) {
    if (!Number.isInteger(p) || p < 0) {
      throw new Error(`Invalid drink price in cents: ${p}`);
    }
  }
  if (!Number.isInteger(discountBps) || discountBps < 0 || discountBps > BPS_DIVISOR) {
    throw new Error(`Invalid discount rate: ${discountBps}`);
  }
  if (!Number.isInteger(vatBps) || vatBps < 0 || vatBps > BPS_DIVISOR) {
    throw new Error(`Invalid VAT rate: ${vatBps}`);
  }

  const subtotalCents = drinkPricesCents.reduce((sum, p) => sum + p, 0);
  const discountCents = Math.min(applyBps(subtotalCents, discountBps), maxDiscountCents);
  const taxableCents = subtotalCents - discountCents;
  const vatCents = applyBps(taxableCents, vatBps);

  return {
    subtotalCents,
    discountBps,
    discountCents,
    taxableCents,
    vatBps,
    vatCents,
    totalCents: taxableCents + vatCents,
  };
}
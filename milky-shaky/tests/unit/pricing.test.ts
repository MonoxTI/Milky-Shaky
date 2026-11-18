import { describe, expect, it } from "vitest";
import {
  applyBps,
  calculateOrderTotals,
  percentToBps,
  priceDrink,
} from "../../src/features/orders/pricing";

describe("percentToBps", () => {
  it("converts percentages to basis points", () => {
    expect(percentToBps(15)).toBe(1500);
    expect(percentToBps("7.50")).toBe(750);
    expect(percentToBps(0)).toBe(0);
  });

  it("rejects out-of-range values", () => {
    expect(() => percentToBps(-1)).toThrow();
    expect(() => percentToBps(101)).toThrow();
    expect(() => percentToBps("abc")).toThrow();
  });
});

describe("applyBps (half-up rounding)", () => {
  it("rounds exactly half up", () => {
    expect(applyBps(1, 5000)).toBe(1); // 0.5 cents -> 1
    expect(applyBps(1, 4999)).toBe(0); // 0.4999 cents -> 0
  });

  it("returns whole cents for exact amounts", () => {
    expect(applyBps(10000, 1500)).toBe(1500);
  });
});

describe("priceDrink", () => {
  it("adds flavour, topping and consistency", () => {
    expect(
      priceDrink({ flavourPriceCents: 1500, toppingPriceCents: 1000, consistencyPriceCents: 300 }),
    ).toBe(2800);
  });

  it("rejects negative or fractional prices", () => {
    expect(() =>
      priceDrink({ flavourPriceCents: -1, toppingPriceCents: 0, consistencyPriceCents: 0 }),
    ).toThrow();
    expect(() =>
      priceDrink({ flavourPriceCents: 1.5, toppingPriceCents: 0, consistencyPriceCents: 0 }),
    ).toThrow();
  });
});

describe("calculateOrderTotals", () => {
  const vat15 = 1500;
  const cap = 5000;

  it("calculates one drink with no discount", () => {
    const t = calculateOrderTotals({
      drinkPricesCents: [2800],
      discountBps: 0,
      maxDiscountCents: cap,
      vatBps: vat15,
    });
    expect(t.subtotalCents).toBe(2800);
    expect(t.discountCents).toBe(0);
    expect(t.vatCents).toBe(420);
    expect(t.totalCents).toBe(3220);
  });

  it("matches the spec example subtotal, using half-up VAT rounding", () => {
    // Spec example: R84.99 subtotal. 15% is R12.7485, which rounds to R12.75.
    // The spec's mock-up shows R12.74 (truncation). Confirm the rule with the client.
    const t = calculateOrderTotals({
      drinkPricesCents: [8499],
      discountBps: 0,
      maxDiscountCents: cap,
      vatBps: vat15,
    });
    expect(t.vatCents).toBe(1275);
    expect(t.totalCents).toBe(9774);
  });

  it("applies the discount before VAT", () => {
    // R100.00 at 10% off: discount R10.00, taxable R90.00, VAT R13.50, total R103.50
    const t = calculateOrderTotals({
      drinkPricesCents: [5000, 5000],
      discountBps: 1000,
      maxDiscountCents: 10000,
      vatBps: vat15,
    });
    expect(t.discountCents).toBe(1000);
    expect(t.taxableCents).toBe(9000);
    expect(t.vatCents).toBe(1350);
    expect(t.totalCents).toBe(10350);
  });

  it("caps the discount at the configured maximum", () => {
    // 15% of R1000 is R150, but the cap is R50
    const t = calculateOrderTotals({
      drinkPricesCents: [100000],
      discountBps: 1500,
      maxDiscountCents: 5000,
      vatBps: vat15,
    });
    expect(t.discountCents).toBe(5000);
    expect(t.taxableCents).toBe(95000);
  });

  it("rejects an empty order", () => {
    expect(() =>
      calculateOrderTotals({ drinkPricesCents: [], discountBps: 0, maxDiscountCents: cap, vatBps: vat15 }),
    ).toThrow();
  });

  it("rejects invalid rates", () => {
    expect(() =>
      calculateOrderTotals({ drinkPricesCents: [100], discountBps: -5, maxDiscountCents: cap, vatBps: vat15 }),
    ).toThrow();
  });
});
import { describe, expect, it } from "vitest";
import { resolveDiscountBps, type DiscountTierRule } from "../../src/features/discounts/eligibility";

const tiers: DiscountTierRule[] = [
  { level: 1, minPriorOrders: 5, minDrinksPerOrder: 2, discountBps: 500, isActive: true },
  { level: 2, minPriorOrders: 10, minDrinksPerOrder: 2, discountBps: 1000, isActive: true },
  { level: 3, minPriorOrders: 20, minDrinksPerOrder: 3, discountBps: 1500, isActive: true },
];

describe("resolveDiscountBps", () => {
  it("gives no discount to a new patron", () => {
    expect(resolveDiscountBps(0, 5, tiers)).toBe(0);
  });

  it("does not count a single-drink order towards a tier", () => {
    expect(resolveDiscountBps(5, 1, tiers)).toBe(0);
  });

  it("applies tier 1 at exactly the minimum", () => {
    expect(resolveDiscountBps(5, 2, tiers)).toBe(500);
  });

  it("stays on tier 1 one order short of tier 2", () => {
    expect(resolveDiscountBps(9, 2, tiers)).toBe(500);
  });

  it("applies tier 2 at exactly the minimum", () => {
    expect(resolveDiscountBps(10, 2, tiers)).toBe(1000);
  });

  it("stays on tier 2 when the order is too small for tier 3", () => {
    expect(resolveDiscountBps(20, 2, tiers)).toBe(1000);
  });

  it("applies tier 3 when both conditions are met", () => {
    expect(resolveDiscountBps(20, 3, tiers)).toBe(1500);
  });

  it("ignores inactive tiers", () => {
    const withInactive = tiers.map((t) => (t.level === 3 ? { ...t, isActive: false } : t));
    expect(resolveDiscountBps(20, 3, withInactive)).toBe(1000);
  });

  it("works when tiers are supplied in any order", () => {
    expect(resolveDiscountBps(20, 3, [...tiers].reverse())).toBe(1500);
  });
});
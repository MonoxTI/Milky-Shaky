import { describe, expect, it } from "vitest";
import { parseRandsToCents } from "../../src/lib/money";
import { isLookupType } from "../../src/features/lookups/config";
import { SETTING_DEFINITIONS, parseSettingInput } from "../../src/features/settings/definitions";
import { parseTierInput, validateTierOrdering, type TierRule } from "../../src/features/discounts/rules";

const find = (key: string) => SETTING_DEFINITIONS.find((d) => d.key === key)!;

describe("parseRandsToCents", () => {
  it("parses whole and decimal rand amounts exactly", () => {
    expect(parseRandsToCents("15")).toBe(1500);
    expect(parseRandsToCents("15.5")).toBe(1550);
    expect(parseRandsToCents("15.05")).toBe(1505);
    expect(parseRandsToCents("0.10")).toBe(10);
  });

  it("rejects invalid amounts", () => {
    expect(parseRandsToCents("1.234")).toBeNull();
    expect(parseRandsToCents("abc")).toBeNull();
    expect(parseRandsToCents("")).toBeNull();
  });
});

describe("isLookupType", () => {
  it("accepts the three lists and rejects anything else", () => {
    expect(isLookupType("flavour")).toBe(true);
    expect(isLookupType("topping")).toBe(true);
    expect(isLookupType("consistency")).toBe(true);
    expect(isLookupType("toString")).toBe(false);
    expect(isLookupType("user")).toBe(false);
  });
});

describe("parseSettingInput", () => {
  it("accepts whole numbers within range", () => {
    expect(parseSettingInput(find("MAX_DRINKS_PER_ORDER"), "10")).toEqual({ ok: true, stored: "10" });
  });

  it("rejects values outside the range", () => {
    expect(parseSettingInput(find("MIN_DRINKS_PER_ORDER"), "0").ok).toBe(false);
    expect(parseSettingInput(find("MAX_DRINKS_PER_ORDER"), "51").ok).toBe(false);
    expect(parseSettingInput(find("MAX_DRINKS_PER_ORDER"), "ten").ok).toBe(false);
  });

  it("stores the VAT rate as a plain number", () => {
    expect(parseSettingInput(find("VAT_PERCENT"), "15.5")).toEqual({ ok: true, stored: "15.5" });
    expect(parseSettingInput(find("VAT_PERCENT"), "101").ok).toBe(false);
  });

  it("converts the maximum discount from rand to cents", () => {
    expect(parseSettingInput(find("MAX_DISCOUNT_CENTS"), "50")).toEqual({ ok: true, stored: "5000" });
    expect(parseSettingInput(find("MAX_DISCOUNT_CENTS"), "20000").ok).toBe(false);
  });
});

describe("validateTierOrdering", () => {
  const base: TierRule[] = [
    { level: 1, minPriorOrders: 5, minDrinksPerOrder: 2, discountBps: 500, isActive: true },
    { level: 2, minPriorOrders: 10, minDrinksPerOrder: 2, discountBps: 1000, isActive: true },
    { level: 3, minPriorOrders: 20, minDrinksPerOrder: 3, discountBps: 1500, isActive: true },
  ];

  it("accepts tiers that rise together", () => {
    expect(validateTierOrdering(base)).toBeNull();
  });

  it("rejects a higher tier that needs fewer previous orders", () => {
    const bad = base.map((t) => (t.level === 2 ? { ...t, minPriorOrders: 3 } : t));
    expect(validateTierOrdering(bad)).toMatch(/fewer previous orders/);
  });

  it("rejects a higher tier that gives a smaller discount", () => {
    const bad = base.map((t) => (t.level === 3 ? { ...t, discountBps: 800 } : t));
    expect(validateTierOrdering(bad)).toMatch(/smaller discount/);
  });

  it("ignores switched-off tiers", () => {
    const off = base.map((t) => (t.level === 2 ? { ...t, isActive: false, minPriorOrders: 1 } : t));
    expect(validateTierOrdering(off)).toBeNull();
  });
});

describe("parseTierInput", () => {
  it("accepts a valid tier", () => {
    expect(
      parseTierInput({ minPriorOrders: "5", minDrinksPerOrder: "2", discountPercent: "7.5", isActive: true }),
    ).toEqual({ ok: true, minPriorOrders: 5, minDrinksPerOrder: 2, discountPercent: "7.5", isActive: true });
  });

  it("rejects a discount above 100%", () => {
    expect(
      parseTierInput({ minPriorOrders: "5", minDrinksPerOrder: "2", discountPercent: "120", isActive: true }).ok,
    ).toBe(false);
  });

  it("rejects zero drinks per order", () => {
    expect(
      parseTierInput({ minPriorOrders: "5", minDrinksPerOrder: "0", discountPercent: "5", isActive: true }).ok,
    ).toBe(false);
  });
});
import { describe, expect, it } from "vitest";
import { diffFields } from "../../src/features/audit/diff";

describe("diffFields", () => {
  it("returns only the fields that changed", () => {
    const before = { name: "Vanilla", priceCents: 1500, isActive: true };
    const after = { name: "Vanilla", priceCents: 1600, isActive: true };
    expect(diffFields(before, after, ["name", "priceCents", "isActive"])).toEqual([
      { field: "priceCents", oldValue: 1500, newValue: 1600 },
    ]);
  });

  it("returns nothing when nothing changed", () => {
    const row = { name: "Oreo", priceCents: 1800 };
    expect(diffFields(row, { ...row }, ["name", "priceCents"])).toEqual([]);
  });

  it("ignores fields that were not listed", () => {
    const before = { priceCents: 1500, updatedAt: "a" };
    const after = { priceCents: 1500, updatedAt: "b" };
    expect(diffFields(before, after, ["priceCents"])).toEqual([]);
  });

  it("records a null-to-value change", () => {
    expect(diffFields({ note: null }, { note: "Out of stock" }, ["note"])).toEqual([
      { field: "note", oldValue: null, newValue: "Out of stock" },
    ]);
  });
});
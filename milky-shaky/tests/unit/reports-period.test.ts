import { describe, expect, it } from "vitest";
import { presetRanges, resolveRange } from "../../src/features/reports/period";

// 12:00 on 19 Nov 2026 in South Africa (UTC+2)
const now = new Date("2026-11-19T10:00:00Z");

describe("resolveRange", () => {
  it("defaults to the last 7 days ending today", () => {
    const range = resolveRange(undefined, undefined, now);
    expect(range.to).toBe("2026-11-19");
    expect(range.from).toBe("2026-11-13");
  });

  it("uses South African midnight for the boundaries", () => {
    const range = resolveRange("2026-11-13", "2026-11-19", now);
    expect(range.start.toISOString()).toBe("2026-11-12T22:00:00.000Z");
    expect(range.endExclusive.toISOString()).toBe("2026-11-19T22:00:00.000Z");
  });

  it("swaps reversed dates", () => {
    const range = resolveRange("2026-11-19", "2026-11-13", now);
    expect(range.from).toBe("2026-11-13");
    expect(range.to).toBe("2026-11-19");
  });

  it("ignores impossible dates and falls back to the default", () => {
    const range = resolveRange("2026-02-30", "not-a-date", now);
    expect(range.to).toBe("2026-11-19");
    expect(range.from).toBe("2026-11-13");
  });

  it("caps very long ranges at 366 days", () => {
    const range = resolveRange("2000-01-01", "2026-11-19", now);
    expect(range.from).toBe("2025-11-19");
  });
});

describe("presetRanges", () => {
  it("starts with a single-day Today preset", () => {
    expect(presetRanges(now)[0]).toEqual({ label: "Today", from: "2026-11-19", to: "2026-11-19" });
  });
});
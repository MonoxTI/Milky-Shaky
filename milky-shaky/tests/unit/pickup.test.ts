import { describe, expect, it } from "vitest";
import { parseLocalPickup, validatePickupTime } from "../../src/features/orders/pickup";

const window = { opensAt: "08:00", closesAt: "21:00", leadMinutes: 15 };
// 12:00 in South Africa (UTC+2, no daylight saving)
const now = new Date("2026-11-16T10:00:00Z");

describe("parseLocalPickup", () => {
  it("treats the value as South African local time", () => {
    expect(parseLocalPickup("2026-11-16T14:30")?.toISOString()).toBe("2026-11-16T12:30:00.000Z");
  });

  it("returns null for garbage input", () => {
    expect(parseLocalPickup("not-a-date")).toBeNull();
  });
});

describe("validatePickupTime", () => {
  it("accepts a time comfortably in the future and within hours", () => {
    expect(validatePickupTime(new Date("2026-11-16T10:30:00Z"), now, window)).toBeNull();
  });

  it("rejects a time inside the prep lead time", () => {
    // 12:10 SAST is only 10 minutes away
    expect(validatePickupTime(new Date("2026-11-16T10:10:00Z"), now, window)).toMatch(/at least 15 minutes/);
  });

  it("rejects a time before opening", () => {
    // 07:30 SAST, in the past, so the lead-time check would fail first. Use a later "now".
    const earlyNow = new Date("2026-11-16T04:00:00Z"); // 06:00 SAST
    expect(validatePickupTime(new Date("2026-11-16T05:30:00Z"), earlyNow, window)).toMatch(/between 08:00 and 21:00/);
  });

  it("rejects a time after closing", () => {
    // 22:00 SAST
    expect(validatePickupTime(new Date("2026-11-16T20:00:00Z"), now, window)).toMatch(/between 08:00 and 21:00/);
  });
});
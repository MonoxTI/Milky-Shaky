import { describe, expect, it } from "vitest";
import {
  POLICIES,
  formatWait,
  limitMessage,
  parseClientIp,
  retryAfterSeconds,
} from "../../src/features/security/policies";

describe("parseClientIp", () => {
  it("uses the last address the hosting proxy appended", () => {
    // A visitor who adds their own header can't change the last entry.
    expect(parseClientIp("1.1.1.1, 203.0.113.9", null)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip when there is no forwarded header", () => {
    expect(parseClientIp(null, "198.51.100.7")).toBe("198.51.100.7");
  });

  it("returns null locally, so IP limits are skipped in development", () => {
    expect(parseClientIp(null, null)).toBeNull();
    expect(parseClientIp("  ", null)).toBeNull();
  });
});

describe("formatWait", () => {
  it("formats seconds, minutes and hours", () => {
    expect(formatWait(30)).toBe("30 seconds");
    expect(formatWait(61)).toBe("2 minutes");
    expect(formatWait(600)).toBe("10 minutes");
    expect(formatWait(3600)).toBe("1 hour");
    expect(formatWait(7200)).toBe("2 hours");
  });
});

describe("retryAfterSeconds", () => {
  it("counts down to the end of the window", () => {
    const windowStart = new Date("2026-11-19T10:00:00Z");
    const now = new Date("2026-11-19T10:05:00Z");
    expect(retryAfterSeconds(windowStart, 15 * 60, now)).toBe(600);
  });

  it("never returns less than one second", () => {
    const windowStart = new Date("2026-11-19T10:00:00Z");
    const now = new Date("2026-11-19T10:15:00Z");
    expect(retryAfterSeconds(windowStart, 15 * 60, now)).toBe(1);
  });
});

describe("limitMessage", () => {
  it("tells the user what was limited and when to try again", () => {
    expect(limitMessage("loginAccount", 600)).toBe(
      "Too many login attempts for this account. Please try again in 10 minutes.",
    );
  });
});

describe("POLICIES", () => {
  it("has a positive limit and window for every policy", () => {
    for (const policy of Object.values(POLICIES)) {
      expect(policy.limit).toBeGreaterThan(0);
      expect(policy.windowSeconds).toBeGreaterThan(0);
    }
  });
});
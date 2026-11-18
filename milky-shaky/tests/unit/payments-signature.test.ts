import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isExpectedAmount, verifyPaystackSignature } from "../../src/features/payments/signature";

const secret = "sk_test_example";
const body = JSON.stringify({ event: "charge.success", data: { reference: "abc", amount: 9774 } });
const validSignature = createHmac("sha512", secret).update(body).digest("hex");

describe("verifyPaystackSignature", () => {
  it("accepts a correctly signed body", () => {
    expect(verifyPaystackSignature(body, validSignature, secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifyPaystackSignature(body.replace("9774", "1"), validSignature, secret)).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifyPaystackSignature(body, null, secret)).toBe(false);
  });

  it("rejects a signature made with a different key", () => {
    const wrong = createHmac("sha512", "sk_test_other").update(body).digest("hex");
    expect(verifyPaystackSignature(body, wrong, secret)).toBe(false);
  });
});

describe("isExpectedAmount", () => {
  it("accepts the amount and currency we charged", () => {
    expect(isExpectedAmount({ amountCents: 9774 }, { amount: 9774, currency: "ZAR" })).toBe(true);
  });

  it("rejects a different amount", () => {
    expect(isExpectedAmount({ amountCents: 9774 }, { amount: 100, currency: "ZAR" })).toBe(false);
  });

  it("rejects a different currency", () => {
    expect(isExpectedAmount({ amountCents: 9774 }, { amount: 9774, currency: "USD" })).toBe(false);
  });
});
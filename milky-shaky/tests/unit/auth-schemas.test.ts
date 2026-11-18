import { describe, expect, it } from "vitest";
import { loginSchema, normalizeMobile, signupSchema } from "../../src/features/auth/schemas";

describe("normalizeMobile", () => {
  it("converts local format to +27", () => {
    expect(normalizeMobile("0821234567")).toBe("+27821234567");
  });

  it("accepts spaces and dashes", () => {
    expect(normalizeMobile("082 123-4567")).toBe("+27821234567");
  });

  it("keeps a valid +27 number", () => {
    expect(normalizeMobile("+27821234567")).toBe("+27821234567");
  });

  it("rejects other formats", () => {
    expect(normalizeMobile("12345")).toBeNull();
    expect(normalizeMobile("abc")).toBeNull();
  });
});

describe("signupSchema", () => {
  const valid = {
    firstName: "Thandi",
    email: "Thandi@Example.co.za",
    mobile: "082 123 4567",
    password: "longenough",
  };

  it("accepts valid input and normalises it", () => {
    const result = signupSchema.parse(valid);
    expect(result.email).toBe("thandi@example.co.za");
    expect(result.mobile).toBe("+27821234567");
  });

  it("rejects a password under 8 characters", () => {
    expect(signupSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signupSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an invalid mobile number", () => {
    expect(signupSchema.safeParse({ ...valid, mobile: "123" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
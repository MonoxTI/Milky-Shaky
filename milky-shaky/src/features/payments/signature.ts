import { createHmac, timingSafeEqual } from "node:crypto";

/** Paystack signs each webhook body with HMAC-SHA512 using your secret key. */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null,
  secretKey: string,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  return expectedBuf.length === signatureBuf.length && timingSafeEqual(expectedBuf, signatureBuf);
}

/** The amount and currency Paystack reports must match what we charged. */
export function isExpectedAmount(
  payment: { amountCents: number },
  transaction: { amount: number; currency: string },
): boolean {
  return transaction.amount === payment.amountCents && transaction.currency === "ZAR";
}
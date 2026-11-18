import { env } from "@/lib/env";

const PAYSTACK_API = "https://api.paystack.co";

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

async function paystackRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const body = (await response.json()) as PaystackEnvelope<T>;
  if (!response.ok || !body.status) {
    throw new Error(`Paystack request failed: ${body.message ?? response.statusText}`);
  }
  return body.data;
}

export interface InitializeInput {
  email: string;
  amountCents: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}

export interface InitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export function initializeTransaction(input: InitializeInput): Promise<InitializeResult> {
  return paystackRequest<InitializeResult>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountCents, // Paystack takes the smallest unit (cents)
      currency: "ZAR",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

export interface VerifyResult {
  status: string; // "success", "failed", "abandoned", ...
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
}

export function verifyTransaction(reference: string): Promise<VerifyResult> {
  return paystackRequest<VerifyResult>(`/transaction/verify/${encodeURIComponent(reference)}`);
}
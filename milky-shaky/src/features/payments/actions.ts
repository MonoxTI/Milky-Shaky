"use server";

import { requireUser } from "@/lib/rbac";
import { PaymentError, startCheckout } from "./service";

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

export async function startCheckoutAction(orderId: string): Promise<CheckoutResult> {
  const user = await requireUser();

  try {
    const url = await startCheckout(user.id, orderId);
    return { ok: true, url };
  } catch (error) {
    if (error instanceof PaymentError) {
      return { ok: false, error: error.message };
    }
    console.error("startCheckoutAction failed", error);
    return { ok: false, error: "Could not start payment. Please try again." };
  }
}
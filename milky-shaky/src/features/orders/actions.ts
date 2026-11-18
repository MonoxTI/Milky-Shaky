"use server";

import { requireUser } from "@/lib/rbac";
import { OrderError, createOrder } from "./service";

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  const user = await requireUser();

  try {
    const orderId = await createOrder(user.id, input);
    return { ok: true, orderId };
  } catch (error) {
    if (error instanceof OrderError) {
      return { ok: false, error: error.message };
    }
    console.error("placeOrderAction failed", error);
    return { ok: false, error: "We couldn't place your order. Please try again." };
  }
}
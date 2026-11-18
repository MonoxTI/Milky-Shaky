import { OrderStatus, PaymentProvider, PaymentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { recordUpdate } from "@/features/audit/recordChange";
import { initializeTransaction, verifyTransaction, type InitializeResult, type VerifyResult } from "./paystack";
import { isExpectedAmount } from "./signature";

export class PaymentError extends Error {}
export type PaymentOutcome = "PAID" | "FAILED" | "PENDING";

const PAYABLE_STATUSES: OrderStatus[] = [OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED];

/** Creates a payment record and returns the Paystack checkout URL to send the patron to. */
export async function startCheckout(userId: string, orderId: string): Promise<string> {
  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    select: { id: true, status: true, totalCents: true, user: { select: { email: true } } },
  });
  if (!order) throw new PaymentError("We couldn't find that order.");
  if (!PAYABLE_STATUSES.includes(order.status)) {
    throw new PaymentError("This order can no longer be paid.");
  }

  const payment = await db.payment.create({
    data: {
      orderId: order.id,
      provider: PaymentProvider.PAYSTACK,
      amountCents: order.totalCents,
      status: PaymentStatus.PENDING,
    },
  });

  let transaction: InitializeResult;
  try {
    transaction = await initializeTransaction({
      email: order.user.email,
      amountCents: order.totalCents,
      reference: payment.id,
      callbackUrl: `${env.APP_URL}/payment/return`,
      metadata: { orderId: order.id, paymentId: payment.id },
    });
  } catch (error) {
    await db.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
    console.error("Paystack initialize failed", error);
    throw new PaymentError("We couldn't reach the payment provider. Please try again.");
  }

  await db.payment.update({
    where: { id: payment.id },
    data: { providerReference: transaction.reference },
  });
  return transaction.authorization_url;
}

/**
 * Checks a payment with Paystack and updates the order. Safe to call repeatedly:
 * once a payment is settled, later calls change nothing.
 */
export async function confirmPayment(paymentId: string): Promise<PaymentOutcome> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, amountCents: true, orderId: true },
  });
  if (!payment) throw new PaymentError("Unknown payment reference.");
  if (payment.status === PaymentStatus.SUCCEEDED) return "PAID";
  if (payment.status === PaymentStatus.FAILED) return "FAILED";

  // Never trust the webhook body or the browser redirect alone: ask Paystack directly.
  const transaction = await verifyTransaction(paymentId);

  if (!isExpectedAmount(payment, transaction)) {
    console.error("Paystack amount or currency mismatch", {
      paymentId,
      expectedCents: payment.amountCents,
      receivedCents: transaction.amount,
      currency: transaction.currency,
    });
    throw new PaymentError("We couldn't verify this payment. Please contact us before trying again.");
  }

  if (transaction.status === "success") {
    await settlePayment(payment.id, payment.orderId, PaymentStatus.SUCCEEDED, transaction);
    return "PAID";
  }
  if (transaction.status === "failed") {
    await settlePayment(payment.id, payment.orderId, PaymentStatus.FAILED, transaction);
    return "FAILED";
  }
  return "PENDING"; // abandoned or still in progress
}

async function settlePayment(
  paymentId: string,
  orderId: string,
  outcome: typeof PaymentStatus.SUCCEEDED | typeof PaymentStatus.FAILED,
  transaction: VerifyResult,
) {
  await db.$transaction(async (tx) => {
    // Claim the payment first. If another request already settled it, stop here.
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: PaymentStatus.PENDING },
      data: {
        status: outcome,
        rawNotification: transaction as unknown as Prisma.InputJsonValue,
      },
    });
    if (claimed.count === 0) return;

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { status: true },
    });

    if (!PAYABLE_STATUSES.includes(order.status)) {
      if (outcome === PaymentStatus.SUCCEEDED) {
        // The patron has paid for an order that can't be fulfilled. Flag it for a refund.
        console.error("Payment succeeded for an order that is no longer payable. Refund required.", {
          orderId,
          paymentId,
          orderStatus: order.status,
        });
      }
      return;
    }

    const nextStatus = outcome === PaymentStatus.SUCCEEDED ? OrderStatus.PAID : OrderStatus.PAYMENT_FAILED;
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        ...(outcome === PaymentStatus.SUCCEEDED ? { paidAt: new Date() } : {}),
      },
    });

    await recordUpdate(tx, {
      entity: "Order",
      entityId: orderId,
      before: { status: order.status },
      after: { status: nextStatus },
      fields: ["status"],
    });
  });
}
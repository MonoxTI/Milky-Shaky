import { render } from "@react-email/components";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { OrderConfirmationEmail, PaymentReceiptEmail, type EmailOrderData } from "./templates/order-emails";

const resend = new Resend(env.RESEND_API_KEY);

export type EmailTemplate = "ORDER_CONFIRMATION" | "PAYMENT_RECEIPT";

interface SendArgs {
  orderId: string;
  to: string;
  template: EmailTemplate;
  subject: string;
  html: string;
}

/** Sends one email and records the attempt. Never throws, so a mail failure can't break an order or payment. */
async function send({ orderId, to, template, subject, html }: SendArgs): Promise<void> {
  const log = await db.emailLog.create({
    data: { orderId, toAddress: to, template, status: "QUEUED" },
    select: { id: true },
  });

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    if (error) throw new Error(error.message);

    await db.emailLog.update({
      where: { id: log.id },
      data: { status: "SENT", providerMessageId: data?.id ?? null },
    });
  } catch (error) {
    console.error(`Email ${template} failed for order ${orderId}`, error);
    await db.emailLog.update({
      where: { id: log.id },
      data: { status: "FAILED", error: error instanceof Error ? error.message : String(error) },
    });
  }
}

/** Loads everything an email needs for an order. */
async function loadOrderForEmail(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      restaurant: { select: { name: true, address: true } },
      user: { select: { firstName: true, email: true } },
    },
  });
  if (!order) return null;

  const data: EmailOrderData = {
    reference: order.reference,
    firstName: order.user.firstName,
    restaurantName: order.restaurant.name,
    restaurantAddress: order.restaurant.address,
    pickupAt: order.pickupAt,
    items: order.items.map((i) => ({
      flavourName: i.flavourName,
      consistencyName: i.consistencyName,
      toppingName: i.toppingName,
      unitPriceCents: i.unitPriceCents,
    })),
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    vatPercent: order.vatPercent.toString(),
    vatCents: order.vatCents,
    totalCents: order.totalCents,
  };
  return { data, email: order.user.email, paidAt: order.paidAt };
}

export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const loaded = await loadOrderForEmail(orderId);
  if (!loaded) return;

  const html = await render(OrderConfirmationEmail({ data: loaded.data }));
  await send({
    orderId,
    to: loaded.email,
    template: "ORDER_CONFIRMATION",
    subject: `Order ${loaded.data.reference} received`,
    html,
  });
}

export async function sendPaymentReceipt(orderId: string, paymentReference: string): Promise<void> {
  const loaded = await loadOrderForEmail(orderId);
  if (!loaded || !loaded.paidAt) return;

  const html = await render(
    PaymentReceiptEmail({ data: loaded.data, paidAt: loaded.paidAt, paymentReference }),
  );
  await send({
    orderId,
    to: loaded.email,
    template: "PAYMENT_RECEIPT",
    subject: `Payment received for order ${loaded.data.reference}`,
    html,
  });
}
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyPaystackSignature } from "@/features/payments/signature";
import { PaymentError, confirmPayment } from "@/features/payments/service";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature, env.PAYSTACK_SECRET_KEY)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } };

  if (event.event === "charge.success" && event.data?.reference) {
    try {
      await confirmPayment(event.data.reference);
    } catch (error) {
      if (error instanceof PaymentError) {
        // Retrying won't fix this, so acknowledge the event. The error has been logged.
        return new NextResponse("ok", { status: 200 });
      }
      console.error("Paystack webhook processing failed", error);
      return new NextResponse("Processing failed", { status: 500 }); // Paystack will retry
    }
  }

  return new NextResponse("ok", { status: 200 });
}
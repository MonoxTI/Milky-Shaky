import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { PaymentError, confirmPayment, type PaymentOutcome } from "@/features/payments/service";
import { requireUser } from "@/lib/rbac";

type Params = Promise<{ reference?: string; trxref?: string }>;

const RESULTS: Record<PaymentOutcome, { heading: string; message: string }> = {
  PAID: { heading: "Payment successful", message: "Thank you for your order." },
  FAILED: { heading: "Payment didn't go through", message: "You can try again from your order." },
  PENDING: {
    heading: "Payment not completed yet",
    message: "If you closed the payment page, you can continue from your order.",
  },
};

export default function PaymentReturnPage({ searchParams }: { searchParams: Params }) {
  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <Suspense fallback={<p className="text-muted-foreground">Checking your payment...</p>}>
        <PaymentResult searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Reads the session and URL parameters, so it sits inside Suspense (required by cacheComponents).
async function PaymentResult({ searchParams }: { searchParams: Params }) {
  const user = await requireUser();
  const { reference, trxref } = await searchParams;
  const paymentId = reference ?? trxref;
  if (!paymentId) notFound();

  const payment = await db.payment.findFirst({
    where: { id: paymentId, order: { userId: user.id } },
    select: { orderId: true },
  });
  if (!payment) notFound();

  let result: { heading: string; message: string };
  try {
    const outcome = await confirmPayment(paymentId);
    result = RESULTS[outcome];
  } catch (error) {
    result = {
      heading: "We couldn't confirm your payment",
      message: error instanceof PaymentError ? error.message : "Please check your order in a moment.",
    };
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">{result.heading}</h1>
      <p className="text-muted-foreground">{result.message}</p>
      <Link href={`/orders/${payment.orderId}`} className="underline">
        View your order
      </Link>
    </>
  );
}
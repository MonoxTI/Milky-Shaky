import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { PaymentError, confirmPayment, type PaymentOutcome } from "@/features/payments/service";
import { requireUser } from "@/lib/rbac";

type Params = Promise<{ reference?: string; trxref?: string }>;
type Tone = "success" | "danger" | "pending";

const RESULTS: Record<PaymentOutcome, { heading: string; message: string; tone: Tone }> = {
  PAID: { heading: "Payment successful", message: "Thank you for your order.", tone: "success" },
  FAILED: {
    heading: "Payment didn't go through",
    message: "You can try again from your order.",
    tone: "danger",
  },
  PENDING: {
    heading: "Payment not completed yet",
    message: "If you closed the payment page, you can continue from your order.",
    tone: "pending",
  },
};

const TONE_STYLES: Record<Tone, { badge: string; symbol: string }> = {
  success: { badge: "bg-emerald-100 text-emerald-700", symbol: "✓" },
  danger: { badge: "bg-red-100 text-red-700", symbol: "!" },
  pending: { badge: "bg-amber-100 text-amber-700", symbol: "…" },
};

export default function PaymentReturnPage({ searchParams }: { searchParams: Params }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-10">
      <Suspense fallback={<p className="text-muted-foreground">Checking your payment...</p>}>
        <PaymentResult searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Reads the session and URL parameters, so it sits inside Suspense (required by cacheComponents).
async function PaymentResult({ searchParams }: { searchParams: Params }) {
  await connection();
  const user = await requireUser();
  const { reference, trxref } = await searchParams;
  const paymentId = reference ?? trxref;
  if (!paymentId) notFound();

  const payment = await db.payment.findFirst({
    where: { id: paymentId, order: { userId: user.id } },
    select: { orderId: true },
  });
  if (!payment) notFound();

  let result: { heading: string; message: string; tone: Tone };
  try {
    const outcome = await confirmPayment(paymentId);
    result = RESULTS[outcome];
  } catch (error) {
    result = {
      heading: "We couldn't confirm your payment",
      message: error instanceof PaymentError ? error.message : "Please check your order in a moment.",
      tone: "danger",
    };
  }

  const style = TONE_STYLES[result.tone];

  return (
    <div className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <span
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${style.badge}`}
      >
        {style.symbol}
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{result.heading}</h1>
        <p className="text-muted-foreground">{result.message}</p>
      </div>
      <Link
        href={`/orders/${payment.orderId}`}
        className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        View your order
      </Link>
    </div>
  );
}
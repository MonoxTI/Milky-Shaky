"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { startCheckoutAction } from "@/features/payments/actions";

export function PayButton({ orderId, label }: { orderId: string; label: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setSubmitting(true);
    setError(null);
    const result = await startCheckoutAction(orderId);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    window.location.assign(result.url);
  }

  return (
    <div className="space-y-2">
      <Button onClick={pay} disabled={submitting} className="w-full">
        {submitting ? "Redirecting to payment..." : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
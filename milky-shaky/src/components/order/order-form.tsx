"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { placeOrderAction } from "@/features/orders/actions";
import { calculateOrderTotals, percentToBps, priceDrink } from "@/features/orders/pricing";
import { resolveDiscountBps, type DiscountTierRule } from "@/features/discounts/eligibility";
import { formatZAR } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Lookup = { id: string; name: string; priceCents: number };
type Restaurant = { id: string; name: string; address: string; opensAt: string; closesAt: string };

export interface OrderFormProps {
  restaurants: Restaurant[];
  flavours: Lookup[];
  toppings: Lookup[];
  consistencies: Lookup[];
  settings: { minDrinks: number; maxDrinks: number; vatPercent: string; maxDiscountCents: number };
  tiers: DiscountTierRule[];
  priorOrders: number;
}

type DrinkValues = { flavourId: string; consistencyId: string; toppingId: string; done: boolean };
type FormValues = { restaurantId: string; pickupAt: string; drinks: DrinkValues[] };

const blankDrink = (): DrinkValues => ({ flavourId: "", consistencyId: "", toppingId: "", done: false });

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function OrderForm({
  restaurants,
  flavours,
  toppings,
  consistencies,
  settings,
  tiers,
  priorOrders,
}: OrderFormProps) {
  const router = useRouter();
  const [countText, setCountText] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      restaurantId: restaurants[0]?.id ?? "",
      pickupAt: "",
      drinks: [blankDrink()],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "drinks" });
  const drinks = useWatch({ control, name: "drinks" });

  const byId = (list: Lookup[]) => new Map(list.map((item) => [item.id, item]));
  const flavourById = byId(flavours);
  const toppingById = byId(toppings);
  const consistencyById = byId(consistencies);

  // Price of one drink, or null until all three choices are made.
  function drinkPrice(d: DrinkValues | undefined): number | null {
    if (!d) return null;
    const flavour = flavourById.get(d.flavourId);
    const topping = toppingById.get(d.toppingId);
    const consistency = consistencyById.get(d.consistencyId);
    if (!flavour || !topping || !consistency) return null;
    return priceDrink({
      flavourPriceCents: flavour.priceCents,
      toppingPriceCents: topping.priceCents,
      consistencyPriceCents: consistency.priceCents,
    });
  }

  function drinkSummary(d: DrinkValues): string {
    return [
      flavourById.get(d.flavourId)?.name,
      consistencyById.get(d.consistencyId)?.name,
      toppingById.get(d.toppingId)?.name,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const prices = fields.map((_, i) => drinkPrice(drinks?.[i]));
  const pricedCents = prices.filter((p): p is number => p !== null);
  const allPriced = fields.length > 0 && pricedCents.length === fields.length;
  const allDone = fields.length > 0 && fields.every((_, i) => !!drinks?.[i]?.done);

  const vatBps = percentToBps(settings.vatPercent);
  const discountBps = resolveDiscountBps(priorOrders, fields.length, tiers);
  const totals = allPriced
    ? calculateOrderTotals({
        drinkPricesCents: pricedCents,
        discountBps,
        maxDiscountCents: settings.maxDiscountCents,
        vatBps,
      })
    : null;

  // Adds or removes drink containers to match the number typed in.
  function changeCount(text: string) {
    setCountText(text);
    const n = Number(text);
    if (!Number.isInteger(n) || n < settings.minDrinks || n > settings.maxDrinks) return;

    const current = fields.length;
    if (n > current) append(Array.from({ length: n - current }, blankDrink));
    if (n < current) remove(Array.from({ length: current - n }, (_, k) => current - 1 - k));
  }

  function setDone(index: number, done: boolean) {
    setValue(`drinks.${index}.done`, done);
  }

  async function onSubmit(values: FormValues) {
    setFormError(null);
    if (!values.drinks.every((d) => d.done)) {
      setFormError("Click Done on every drink before continuing.");
      return;
    }

    setSubmitting(true);
    const result = await placeOrderAction({
      restaurantId: values.restaurantId,
      pickupAt: values.pickupAt,
      drinks: values.drinks.map(({ flavourId, consistencyId, toppingId }) => ({
        flavourId,
        consistencyId,
        toppingId,
      })),
    });

    if (!result.ok) {
      setFormError(result.error);
      setSubmitting(false);
      return;
    }
    router.push(`/orders/${result.orderId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Pickup details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurantId">Restaurant</Label>
              <select id="restaurantId" className={selectClass} required {...register("restaurantId")}>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.opensAt}–{r.closesAt})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupAt">Pickup time</Label>
              <Input id="pickupAt" type="datetime-local" step={900} required {...register("pickupAt")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your drinks</CardTitle>
            <CardDescription>Choose a flavour, consistency and topping for each milkshake.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="drinkCount">Number of drinks</Label>
              <Input
                id="drinkCount"
                type="text"
                inputMode="numeric"
                className="w-24"
                value={countText}
                onChange={(e) => changeCount(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                {settings.minDrinks} to {settings.maxDrinks}
              </span>
            </div>

            {fields.map((field, i) => {
              const d = drinks?.[i];
              const done = !!d?.done;
              const price = prices[i];

              return (
                <div key={field.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Milkshake {i + 1}</h3>
                    <div className="flex items-center gap-2">
                      {done && <Badge variant="secondary">Done</Badge>}
                      {price !== null && <span className="text-sm font-medium">{formatZAR(price)}</span>}
                    </div>
                  </div>

                  {done && d ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{drinkSummary(d)}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => setDone(i, false)}>
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Flavour</Label>
                        <select className={selectClass} {...register(`drinks.${i}.flavourId`)}>
                          <option value="">Select</option>
                          {flavours.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Thick or not</Label>
                        <select className={selectClass} {...register(`drinks.${i}.consistencyId`)}>
                          <option value="">Select</option>
                          {consistencies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Topping</Label>
                        <select className={selectClass} {...register(`drinks.${i}.toppingId`)}>
                          <option value="">Select</option>
                          {toppings.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end sm:col-span-3">
                        <Button type="button" disabled={price === null} onClick={() => setDone(i, true)}>
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Number of drinks" value={String(fields.length)} />
            <Row label="Subtotal" value={totals ? formatZAR(totals.subtotalCents) : "—"} />
            <Row
              label={discountBps > 0 ? `Frequent customer discount (${discountBps / 100}%)` : "Frequent customer discount"}
              value={totals ? formatZAR(totals.discountCents) : "—"}
            />
            <Row label={`VAT (${settings.vatPercent}%)`} value={totals ? formatZAR(totals.vatCents) : "—"} />
            <div className="border-t pt-3">
              <Row label="Total" value={totals ? formatZAR(totals.totalCents) : "—"} bold />
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <Button type="submit" className="w-full" disabled={!allDone || submitting}>
              {submitting ? "Placing order..." : "Continue"}
            </Button>
            {!allDone && (
              <p className="text-xs text-muted-foreground">Click Done on every drink to continue.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
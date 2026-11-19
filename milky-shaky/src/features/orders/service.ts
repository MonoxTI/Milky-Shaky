import { randomBytes } from "node:crypto";
import { OrderStatus } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { db } from "@/lib/db";
import { getOrderingSettings } from "@/features/settings/service";
import { resolveDiscountBps } from "@/features/discounts/eligibility";
import { sendOrderConfirmation } from "@/features/email/service";
import { calculateOrderTotals, percentToBps, priceDrink } from "./pricing";
import { STORE_TIME_ZONE, parseLocalPickup, validatePickupTime } from "./pickup";
import { orderInputSchema, type OrderInput } from "./schemas";
import { countCompletedOrders, getActiveDiscountTiers } from "./queries";

/** An error the patron can read. Anything else is logged and shown generically. */
export class OrderError extends Error {}

function makeReference(now: Date): string {
  const day = formatInTimeZone(now, STORE_TIME_ZONE, "yyyyMMdd");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `MS-${day}-${suffix}`;
}

/** Sends the confirmation email. A failure is logged and never breaks order creation. */
async function sendConfirmationSafely(orderId: string): Promise<void> {
  try {
    await sendOrderConfirmation(orderId);
  } catch (error) {
    console.error(`Could not send confirmation email for order ${orderId}`, error);
  }
}

/** Validates the order, recalculates every price from the database, and saves it. */
export async function createOrder(userId: string, rawInput: unknown): Promise<string> {
  const parsed = orderInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new OrderError(parsed.error.issues[0]?.message ?? "Invalid order.");
  }
  const input: OrderInput = parsed.data;

  const settings = await getOrderingSettings();
  if (input.drinks.length < settings.minDrinks || input.drinks.length > settings.maxDrinks) {
    throw new OrderError(
      `An order must have between ${settings.minDrinks} and ${settings.maxDrinks} drinks.`,
    );
  }

  const restaurant = await db.restaurant.findFirst({
    where: { id: input.restaurantId, isActive: true },
  });
  if (!restaurant) throw new OrderError("Please choose a valid pickup restaurant.");

  const pickupAt = parseLocalPickup(input.pickupAt);
  if (!pickupAt) throw new OrderError("Please choose a valid pickup time.");

  const now = new Date();
  const timeError = validatePickupTime(pickupAt, now, {
    opensAt: restaurant.opensAt,
    closesAt: restaurant.closesAt,
    leadMinutes: settings.prepLeadMinutes,
  });
  if (timeError) throw new OrderError(timeError);

  const unique = (values: string[]) => [...new Set(values)];
  const [flavours, toppings, consistencies] = await Promise.all([
    db.flavour.findMany({
      where: { id: { in: unique(input.drinks.map((d) => d.flavourId)) }, isActive: true },
    }),
    db.topping.findMany({
      where: { id: { in: unique(input.drinks.map((d) => d.toppingId)) }, isActive: true },
    }),
    db.consistency.findMany({
      where: { id: { in: unique(input.drinks.map((d) => d.consistencyId)) }, isActive: true },
    }),
  ]);

  const flavourById = new Map(flavours.map((f) => [f.id, f]));
  const toppingById = new Map(toppings.map((t) => [t.id, t]));
  const consistencyById = new Map(consistencies.map((c) => [c.id, c]));

  const lines = input.drinks.map((d) => {
    const flavour = flavourById.get(d.flavourId);
    const topping = toppingById.get(d.toppingId);
    const consistency = consistencyById.get(d.consistencyId);
    if (!flavour || !topping || !consistency) {
      throw new OrderError("One of your selections is no longer available. Please review your order.");
    }
    return {
      flavour,
      topping,
      consistency,
      unitPriceCents: priceDrink({
        flavourPriceCents: flavour.priceCents,
        toppingPriceCents: topping.priceCents,
        consistencyPriceCents: consistency.priceCents,
      }),
    };
  });

  const [priorOrders, tiers] = await Promise.all([
    countCompletedOrders(userId),
    getActiveDiscountTiers(),
  ]);
  const discountBps = resolveDiscountBps(priorOrders, lines.length, tiers);
  const vatBps = percentToBps(settings.vatPercent);

  const totals = calculateOrderTotals({
    drinkPricesCents: lines.map((l) => l.unitPriceCents),
    discountBps,
    maxDiscountCents: settings.maxDiscountCents,
    vatBps,
  });

  const order = await db.order.create({
    data: {
      reference: makeReference(now),
      userId,
      restaurantId: restaurant.id,
      pickupAt,
      status: OrderStatus.PENDING_PAYMENT,
      subtotalCents: totals.subtotalCents,
      discountPercent: (discountBps / 100).toFixed(2),
      discountCents: totals.discountCents,
      vatPercent: (vatBps / 100).toFixed(2),
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      items: {
        create: lines.map((l) => ({
          flavourId: l.flavour.id,
          toppingId: l.topping.id,
          consistencyId: l.consistency.id,
          // Names and prices are copied, so later lookup changes don't alter this order.
          flavourName: l.flavour.name,
          toppingName: l.topping.name,
          consistencyName: l.consistency.name,
          unitPriceCents: l.unitPriceCents,
        })),
      },
    },
    select: { id: true },
  });

  // The order is saved at this point. The email is sent after, and any failure is only logged.
  await sendConfirmationSafely(order.id);

  return order.id;
}
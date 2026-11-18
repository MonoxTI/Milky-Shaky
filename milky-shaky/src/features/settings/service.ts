import { db } from "@/lib/db";

export interface OrderingSettings {
  minDrinks: number;
  maxDrinks: number;
  vatPercent: string;
  prepLeadMinutes: number;
  maxDiscountCents: number;
}

const REQUIRED_KEYS = [
  "MIN_DRINKS_PER_ORDER",
  "MAX_DRINKS_PER_ORDER",
  "VAT_PERCENT",
  "PREP_LEAD_MINUTES",
  "MAX_DISCOUNT_CENTS",
] as const;

export async function getOrderingSettings(): Promise<OrderingSettings> {
  const rows = await db.setting.findMany({
    where: { key: { in: [...REQUIRED_KEYS] } },
  });
  const values = new Map(rows.map((r) => [r.key, r.value]));

  const read = (key: (typeof REQUIRED_KEYS)[number]): string => {
    const value = values.get(key);
    if (value === undefined) throw new Error(`Missing setting: ${key}`);
    return value;
  };

  return {
    minDrinks: Number(read("MIN_DRINKS_PER_ORDER")),
    maxDrinks: Number(read("MAX_DRINKS_PER_ORDER")),
    vatPercent: read("VAT_PERCENT"),
    prepLeadMinutes: Number(read("PREP_LEAD_MINUTES")),
    maxDiscountCents: Number(read("MAX_DISCOUNT_CENTS")),
  };
}
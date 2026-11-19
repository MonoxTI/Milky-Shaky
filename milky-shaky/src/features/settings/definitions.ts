import { formatZAR, parseRandsToCents } from "@/lib/money";

export type SettingKind = "int" | "percent" | "rands";

export interface SettingDefinition {
  key: string;
  label: string;
  help: string;
  kind: SettingKind;
  min: number;
  max: number;
}

// Keys must match the ones written by the seed script and read by the ordering code.
export const SETTING_DEFINITIONS: SettingDefinition[] = [
  {
    key: "MIN_DRINKS_PER_ORDER",
    label: "Minimum drinks per order",
    help: "A patron must order at least this many drinks.",
    kind: "int",
    min: 1,
    max: 50,
  },
  {
    key: "MAX_DRINKS_PER_ORDER",
    label: "Maximum drinks per order",
    help: "A patron can order at most this many drinks in one order.",
    kind: "int",
    min: 1,
    max: 50,
  },
  {
    key: "VAT_PERCENT",
    label: "VAT rate (%)",
    help: "Applied to the discounted subtotal. Existing orders keep the rate they were placed with.",
    kind: "percent",
    min: 0,
    max: 100,
  },
  {
    key: "PREP_LEAD_MINUTES",
    label: "Preparation lead time (minutes)",
    help: "Minimum minutes between placing an order and its pickup time.",
    kind: "int",
    min: 0,
    max: 240,
  },
  {
    key: "MAX_DISCOUNT_CENTS",
    label: "Maximum discount per order (R)",
    help: "The frequent customer discount can never be more than this amount.",
    kind: "rands",
    min: 0,
    max: 1_000_000,
  },
];

export type ParseResult = { ok: true; stored: string } | { ok: false; error: string };

/** Turns a form value into the string stored in the Setting table, or explains why it's invalid. */
export function parseSettingInput(def: SettingDefinition, raw: string): ParseResult {
  const value = raw.trim();

  if (def.kind === "int") {
    if (!/^\d+$/.test(value)) return { ok: false, error: "Enter a whole number." };
    const n = Number(value);
    if (n < def.min || n > def.max) return { ok: false, error: `Enter a value from ${def.min} to ${def.max}.` };
    return { ok: true, stored: String(n) };
  }

  if (def.kind === "percent") {
    if (!/^\d{1,3}(\.\d{1,2})?$/.test(value)) return { ok: false, error: "Enter a percentage such as 15 or 15.5." };
    const n = Number(value);
    if (n < def.min || n > def.max) return { ok: false, error: `Enter a percentage from ${def.min} to ${def.max}.` };
    return { ok: true, stored: String(n) };
  }

  const cents = parseRandsToCents(value);
  if (cents === null) return { ok: false, error: "Enter an amount in rand, such as 50 or 50.00." };
  if (cents < def.min || cents > def.max) {
    return { ok: false, error: `Enter an amount from R${def.min / 100} to R${def.max / 100}.` };
  }
  return { ok: true, stored: String(cents) };
}

/** How a stored value appears on screen. */
export function displayValue(def: SettingDefinition, stored: string): string {
  if (def.kind === "rands") return formatZAR(Number(stored));
  if (def.kind === "percent") return `${stored}%`;
  return stored;
}

/** The value pre-filled in the edit box. */
export function inputValue(def: SettingDefinition, stored: string): string {
  if (def.kind === "rands") return (Number(stored) / 100).toFixed(2);
  return stored;
}
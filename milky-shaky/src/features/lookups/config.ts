import { z } from "zod";
import { parseRandsToCents } from "@/lib/money";

export const LOOKUP_TYPES = {
  flavour: { label: "Flavours", entity: "Flavour", singular: "flavour" },
  topping: { label: "Toppings", entity: "Topping", singular: "topping" },
  consistency: { label: "Consistency", entity: "Consistency", singular: "consistency option" },
} as const;

export type LookupType = keyof typeof LOOKUP_TYPES;

export function isLookupType(value: string): value is LookupType {
  return Object.prototype.hasOwnProperty.call(LOOKUP_TYPES, value);
}

export const lookupFormSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name").max(60, "Name must be 60 characters or fewer"),
    price: z.string().trim().refine((v) => parseRandsToCents(v) !== null, "Enter a price such as 15 or 15.50"),
    sortOrder: z.coerce.number().int("Display order must be a whole number").min(0).max(999),
    isActive: z.boolean(),
  })
  .transform((v) => ({
    name: v.name,
    priceCents: parseRandsToCents(v.price) ?? 0,
    sortOrder: v.sortOrder,
    isActive: v.isActive,
  }));

export type LookupInput = z.output<typeof lookupFormSchema>;

/** Reads a lookup form. Checkboxes send "on" when ticked and nothing when not. */
export function readLookupForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    price: String(formData.get("price") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    isActive: formData.get("isActive") === "on",
  };
}
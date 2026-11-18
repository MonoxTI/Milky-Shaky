import { z } from "zod";

export const drinkSelectionSchema = z.object({
  flavourId: z.string().min(1, "Choose a flavour"),
  consistencyId: z.string().min(1, "Choose a consistency"),
  toppingId: z.string().min(1, "Choose a topping"),
});

export const orderInputSchema = z.object({
  restaurantId: z.string().min(1, "Choose a restaurant"),
  pickupAt: z.string().min(1, "Choose a pickup time"),
  drinks: z.array(drinkSelectionSchema).min(1, "Add at least one drink"),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
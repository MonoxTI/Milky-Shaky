"use server";

import { flashTo } from "@/lib/flash";
import { requireRole } from "@/lib/rbac";
import { DiscountError, updateTier } from "./admin";
import { parseTierInput } from "./rules";

export async function updateTierAction(formData: FormData) {
  const user = await requireRole("MANAGER");
  const level = Number(formData.get("level"));

  if (!Number.isInteger(level) || level < 1) flashTo("/admin/discounts", "error", "That tier doesn't exist.");

  const parsed = parseTierInput({
    minPriorOrders: String(formData.get("minPriorOrders") ?? ""),
    minDrinksPerOrder: String(formData.get("minDrinksPerOrder") ?? ""),
    discountPercent: String(formData.get("discountPercent") ?? ""),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.ok) flashTo("/admin/discounts", "error", parsed.error);

  try {
    await updateTier(user.id, level, parsed);
  } catch (error) {
    if (error instanceof DiscountError) flashTo("/admin/discounts", "error", error.message);
    throw error;
  }
  flashTo("/admin/discounts", "notice", `Tier ${level} saved. It applies to new orders from now on.`);
}
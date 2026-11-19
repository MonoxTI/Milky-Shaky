"use server";

import { flashTo } from "@/lib/flash";
import { requireRole } from "@/lib/rbac";
import { SettingError, updateSetting } from "./admin";

export async function updateSettingAction(formData: FormData) {
  const user = await requireRole("MANAGER");
  const key = String(formData.get("key") ?? "");
  const value = String(formData.get("value") ?? "");

  try {
    await updateSetting(user.id, key, value);
  } catch (error) {
    if (error instanceof SettingError) flashTo("/admin/settings", "error", error.message);
    throw error;
  }
  flashTo("/admin/settings", "notice", "Setting saved. It applies to new orders from now on.");
}
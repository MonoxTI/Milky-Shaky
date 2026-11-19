"use server";

import { flashTo } from "@/lib/flash";
import { requireRole } from "@/lib/rbac";
import { consumeRateLimit } from "@/features/security/rate-limit";
import { UserError, createStaffUser, setUserActive } from "./admin";

export async function createUserAction(formData: FormData) {
  const user = await requireRole("MANAGER");

  const blocked = await consumeRateLimit("staffCreateUser", user.id);
  if (blocked) flashTo("/admin/users", "error", blocked);

  const role = formData.get("role") === "MANAGER" ? "MANAGER" : "CLIENT";

  try {
    await createStaffUser(user.id, {
      firstName: String(formData.get("firstName") ?? ""),
      email: String(formData.get("email") ?? ""),
      mobile: String(formData.get("mobile") ?? ""),
      password: String(formData.get("password") ?? ""),
      role,
    });
  } catch (error) {
    if (error instanceof UserError) flashTo("/admin/users", "error", error.message);
    throw error;
  }
  flashTo("/admin/users", "notice", `${role === "MANAGER" ? "Manager" : "Client"} account created.`);
}

export async function setUserActiveAction(formData: FormData) {
  const user = await requireRole("MANAGER");
  const targetId = String(formData.get("userId") ?? "");
  const active = formData.get("active") === "true";

  try {
    await setUserActive(user.id, targetId, active);
  } catch (error) {
    if (error instanceof UserError) flashTo("/admin/users", "error", error.message);
    throw error;
  }
  flashTo(
    "/admin/users",
    "notice",
    active ? "Account reactivated." : "Account deactivated. They lose access on their next page visit.",
  );
}
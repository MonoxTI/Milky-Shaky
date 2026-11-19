"use server";

import { flashTo } from "@/lib/flash";
import { requireRole } from "@/lib/rbac";
import { LOOKUP_TYPES, isLookupType, lookupFormSchema, readLookupForm, type LookupType } from "./config";
import { LookupError, createLookup, setLookupActive, updateLookup } from "./service";

function pathFor(type: LookupType): string {
  return `/admin/lookups/${type}`;
}

function readType(formData: FormData): LookupType {
  const type = String(formData.get("type") ?? "");
  if (!isLookupType(type)) flashTo("/admin/lookups", "error", "That list doesn't exist.");
  return type;
}

export async function createLookupAction(formData: FormData) {
  const user = await requireRole("MANAGER");
  const type = readType(formData);

  const parsed = lookupFormSchema.safeParse(readLookupForm(formData));
  if (!parsed.success) {
    flashTo(pathFor(type), "error", parsed.error.issues[0]?.message ?? "Check the form and try again.");
  }

  try {
    await createLookup(user.id, type, parsed.data);
  } catch (error) {
    if (error instanceof LookupError) flashTo(pathFor(type), "error", error.message);
    throw error;
  }
  flashTo(pathFor(type), "notice", `${LOOKUP_TYPES[type].singular} added.`);
}

export async function updateLookupAction(formData: FormData) {
  const user = await requireRole("MANAGER");
  const type = readType(formData);
  const id = String(formData.get("id") ?? "");

  const parsed = lookupFormSchema.safeParse(readLookupForm(formData));
  if (!id) flashTo(pathFor(type), "error", "Missing item. Please try again.");
  if (!parsed.success) {
    flashTo(pathFor(type), "error", parsed.error.issues[0]?.message ?? "Check the form and try again.");
  }

  try {
    await updateLookup(user.id, type, id, parsed.data);
  } catch (error) {
    if (error instanceof LookupError) flashTo(pathFor(type), "error", error.message);
    throw error;
  }
  flashTo(pathFor(type), "notice", "Changes saved. Existing orders keep their original prices.");
}

export async function toggleLookupAction(formData: FormData) {
  const user = await requireRole("MANAGER");
  const type = readType(formData);
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";

  try {
    await setLookupActive(user.id, type, id, active);
  } catch (error) {
    if (error instanceof LookupError) flashTo(pathFor(type), "error", error.message);
    throw error;
  }
  flashTo(
    pathFor(type),
    "notice",
    active ? "Item activated and shown on the menu." : "Item hidden from the menu. Past orders are unaffected.",
  );
}
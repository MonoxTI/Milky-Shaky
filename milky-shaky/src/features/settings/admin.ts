import { db } from "@/lib/db";
import { recordUpdate } from "@/features/audit/recordChange";
import { SETTING_DEFINITIONS, parseSettingInput } from "./definitions";

export class SettingError extends Error {}

const MIN_KEY = "MIN_DRINKS_PER_ORDER";
const MAX_KEY = "MAX_DRINKS_PER_ORDER";

export async function listSettings(): Promise<Map<string, string>> {
  const rows = await db.setting.findMany({
    where: { key: { in: SETTING_DEFINITIONS.map((d) => d.key) } },
  });
  return new Map(rows.map((r) => [r.key, r.value]));
}

export async function updateSetting(actorId: string, key: string, raw: string): Promise<void> {
  const def = SETTING_DEFINITIONS.find((d) => d.key === key);
  if (!def) throw new SettingError("That setting doesn't exist.");

  const parsed = parseSettingInput(def, raw);
  if (!parsed.ok) throw new SettingError(parsed.error);

  await db.$transaction(async (tx) => {
    const before = await tx.setting.findUnique({ where: { key } });
    if (!before) throw new SettingError("This setting is missing. Run the seed script and try again.");

    // The minimum and maximum drinks must stay consistent with each other.
    if (key === MIN_KEY || key === MAX_KEY) {
      const otherKey = key === MIN_KEY ? MAX_KEY : MIN_KEY;
      const other = await tx.setting.findUnique({ where: { key: otherKey } });
      if (other) {
        const min = key === MIN_KEY ? Number(parsed.stored) : Number(other.value);
        const max = key === MAX_KEY ? Number(parsed.stored) : Number(other.value);
        if (min > max) throw new SettingError("The minimum number of drinks can't be higher than the maximum.");
      }
    }

    const after = await tx.setting.update({
      where: { key },
      data: { value: parsed.stored, updatedById: actorId },
    });

    await recordUpdate(tx, {
      entity: "Setting",
      entityId: key,
      actorId,
      before: { value: before.value },
      after: { value: after.value },
      fields: ["value"],
    });
  });
}
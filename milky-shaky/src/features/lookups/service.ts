import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { recordCreate, recordUpdate } from "@/features/audit/recordChange";
import { LOOKUP_TYPES, type LookupInput, type LookupType } from "./config";

export class LookupError extends Error {}

export type LookupRow = {
  id: string;
  name: string;
  priceCents: number;
  sortOrder: number;
  isActive: boolean;
};

// Flavour, Topping and Consistency have the same columns, so one interface covers all three.
interface LookupDelegate {
  findMany(args: { orderBy: { sortOrder: "asc" } }): Promise<LookupRow[]>;
  findUnique(args: { where: { id: string } }): Promise<LookupRow | null>;
  create(args: { data: LookupInput }): Promise<LookupRow>;
  update(args: { where: { id: string }; data: Partial<LookupInput> }): Promise<LookupRow>;
}

function delegate(client: Prisma.TransactionClient, type: LookupType): LookupDelegate {
  return client[type] as unknown as LookupDelegate;
}

const EDITABLE_FIELDS = ["name", "priceCents", "sortOrder", "isActive"];

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string }).code === "P2002";
}

export async function listLookups(type: LookupType): Promise<LookupRow[]> {
  return delegate(db, type).findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createLookup(actorId: string, type: LookupType, input: LookupInput): Promise<void> {
  const { entity, singular } = LOOKUP_TYPES[type];
  try {
    await db.$transaction(async (tx) => {
      const row = await delegate(tx, type).create({ data: input });
      await recordCreate(tx, { entity, entityId: row.id, snapshot: row, actorId });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new LookupError(`A ${singular} called "${input.name}" already exists.`);
    }
    throw error;
  }
}

export async function updateLookup(
  actorId: string,
  type: LookupType,
  id: string,
  input: LookupInput,
): Promise<void> {
  const { entity, singular } = LOOKUP_TYPES[type];
  try {
    await db.$transaction(async (tx) => {
      const model = delegate(tx, type);
      const before = await model.findUnique({ where: { id } });
      if (!before) throw new LookupError(`That ${singular} no longer exists.`);

      const after = await model.update({ where: { id }, data: input });
      await recordUpdate(tx, { entity, entityId: id, actorId, before, after, fields: EDITABLE_FIELDS });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new LookupError(`A ${singular} called "${input.name}" already exists.`);
    }
    throw error;
  }
}

export async function setLookupActive(actorId: string, type: LookupType, id: string, active: boolean): Promise<void> {
  const { entity, singular } = LOOKUP_TYPES[type];
  await db.$transaction(async (tx) => {
    const model = delegate(tx, type);
    const before = await model.findUnique({ where: { id } });
    if (!before) throw new LookupError(`That ${singular} no longer exists.`);
    if (before.isActive === active) return;

    const after = await model.update({ where: { id }, data: { isActive: active } });
    await recordUpdate(tx, { entity, entityId: id, actorId, before, after, fields: ["isActive"] });
  });
}
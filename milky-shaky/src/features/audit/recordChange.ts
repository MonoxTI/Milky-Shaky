import { AuditAction, Prisma } from "@prisma/client";
import { diffFields } from "./diff";

type Tx = Prisma.TransactionClient;

// Prisma needs an explicit DbNull marker to store NULL in a Json column.
const toJson = (value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  value === null || value === undefined ? Prisma.DbNull : (value as Prisma.InputJsonValue);

interface AuditContext {
  actorId?: string | null;
  ipAddress?: string | null;
}

/** Writes one AuditLog row per changed field. Returns how many rows were written. */
export async function recordUpdate(
  tx: Tx,
  args: AuditContext & {
    entity: string;
    entityId: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    fields: string[];
  },
): Promise<number> {
  const changes = diffFields(args.before, args.after, args.fields);
  if (changes.length === 0) return 0;

  await tx.auditLog.createMany({
    data: changes.map((c) => ({
      entity: args.entity,
      entityId: args.entityId,
      action: AuditAction.UPDATE,
      field: c.field,
      oldValue: toJson(c.oldValue),
      newValue: toJson(c.newValue),
      actorId: args.actorId ?? null,
      ipAddress: args.ipAddress ?? null,
    })),
  });
  return changes.length;
}

/** Records the creation of a record, with a snapshot of its values. */
export async function recordCreate(
  tx: Tx,
  args: AuditContext & {
    entity: string;
    entityId: string;
    snapshot: Record<string, unknown>;
  },
): Promise<void> {
  await tx.auditLog.create({
    data: {
      entity: args.entity,
      entityId: args.entityId,
      action: AuditAction.CREATE,
      field: null,
      oldValue: Prisma.DbNull,
      newValue: toJson(args.snapshot),
      actorId: args.actorId ?? null,
      ipAddress: args.ipAddress ?? null,
    },
  });
}
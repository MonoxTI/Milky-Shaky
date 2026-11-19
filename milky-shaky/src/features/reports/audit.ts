import { db } from "@/lib/db";
import type { DateRange } from "./period";

export const AUDIT_PAGE_SIZE = 50;

export interface AuditFilters {
  range: DateRange;
  entity?: string;
  actorId?: string;
  page: number;
}

export async function getAuditReport({ range, entity, actorId, page }: AuditFilters) {
  const where = {
    createdAt: { gte: range.start, lt: range.endExclusive },
    ...(entity ? { entity } : {}),
    ...(actorId ? { actorId } : {}),
  };

  const [total, rows, entityRows, managers] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      include: { actor: { select: { firstName: true } } },
    }),
    db.auditLog.findMany({
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
    }),
    db.user.findMany({
      where: { role: "MANAGER" },
      select: { id: true, firstName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  return {
    total,
    rows,
    pageCount: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
    entities: entityRows.map((r) => r.entity),
    managers,
  };
}
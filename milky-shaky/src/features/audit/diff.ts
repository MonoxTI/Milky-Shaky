// Pure diffing logic for the audit trail.

export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

function isSame(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Returns only the listed fields whose values differ between before and after. */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of fields) {
    if (!isSame(before[field], after[field])) {
      changes.push({ field, oldValue: before[field] ?? null, newValue: after[field] ?? null });
    }
  }
  return changes;
}
/**
 * Field-level diffing for the audit trail.
 *
 * Pure and I/O free — `spec.md` §3.2 rule 3. The repository layer calls this
 * inside its write transaction so every mutation records what actually changed
 * rather than only a summary string (brief §6.18).
 */

/**
 * Bookkeeping fields that change on every single write. Recording them would
 * bury the fields a human actually wants to see.
 */
export const AUDIT_IGNORED_FIELDS = [
  'updatedAt',
  'updatedBy',
  'version',
  'syncStatus',
] as const

export interface EntityDiff {
  changedFields: string[]
  previousValues: Record<string, unknown>
  newValues: Record<string, unknown>
}

/** Structural equality via canonical JSON — handles nested addresses and arrays. */
function isEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true
  if (left === null || right === null || left === undefined || right === undefined) {
    // `null` and `undefined` both mean "not set" across our optional fields.
    return (left ?? null) === (right ?? null)
  }
  if (typeof left !== 'object' || typeof right !== 'object') return false
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right))
}

/** Sort object keys so key order never registers as a change. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, canonical((value as Record<string, unknown>)[key])]),
    )
  }
  return value
}

/**
 * Compare two versions of an entity.
 *
 * Returns only the fields that differ, so an audit row stays small and reads as
 * a changelog. A field present on one side and absent on the other counts as a
 * change; `undefined` and `null` are treated as the same "not set" value,
 * because our optional fields use both interchangeably.
 */
export function diffEntities(
  before: object | undefined,
  after: object,
  ignoredFields: readonly string[] = AUDIT_IGNORED_FIELDS,
): EntityDiff {
  // Accepts `object` so typed entities pass without a cast at every call site.
  const beforeRecord = before as Record<string, unknown> | undefined
  const afterRecord = after as Record<string, unknown>

  const ignored = new Set(ignoredFields)
  const keys = new Set([...Object.keys(beforeRecord ?? {}), ...Object.keys(afterRecord)])

  const changedFields: string[] = []
  const previousValues: Record<string, unknown> = {}
  const newValues: Record<string, unknown> = {}

  for (const key of [...keys].sort()) {
    if (ignored.has(key)) continue
    const previous = beforeRecord?.[key]
    const next = afterRecord[key]
    if (isEqual(previous, next)) continue

    changedFields.push(key)
    previousValues[key] = previous ?? null
    newValues[key] = next ?? null
  }

  return { changedFields, previousValues, newValues }
}

/**
 * Human label for a field name — `paymentTermsDays` becomes "Payment terms days".
 * Kept here so the UI and any future export share one rendering.
 */
export function formatFieldName(field: string): string {
  return field
    // Sentence case, not title case: "Payment terms days", not "Payment Terms Days".
    .replace(/([a-z0-9])([A-Z])/g, (_, before: string, after: string) => `${before} ${after.toLowerCase()}`)
    .replace(/[_.]/g, ' ')
    .replace(/^\w/, (character) => character.toUpperCase())
}

/** Compact display value for an audited field. */
export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length === 0 ? 'None' : `${value.length} item(s)`
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== '')
      .map(([, entryValue]) => String(entryValue))
    return entries.length > 0 ? entries.join(', ') : '—'
  }
  return String(value)
}

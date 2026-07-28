import { db } from '@/db/astra-db'
import type { AuditLogEntry } from '@/types/audit'
import { createId } from '@/utils/id'
import { nowUtcIso } from '@/utils/time'

export async function writeAuditLog(
  input: Omit<AuditLogEntry, 'id' | 'createdAt'>,
): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: createId(),
    createdAt: nowUtcIso(),
    ...input,
  }
  await db.auditLogs.add(entry)
  return entry
}

import { db } from '@/db/astra-db'
import type { AuditLogEntry } from '@/types/audit'

export async function listAuditTrail(limit = 20): Promise<AuditLogEntry[]> {
  return db.auditLogs.orderBy('createdAt').reverse().limit(limit).toArray()
}

export async function listAuditTrailForEntity(entityId: string): Promise<AuditLogEntry[]> {
  const rows = await db.auditLogs.where('entityId').equals(entityId).toArray()
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

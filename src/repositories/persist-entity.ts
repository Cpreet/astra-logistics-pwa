import type { Table } from 'dexie'
import { db } from '@/db/astra-db'
import type { BaseEntity } from '@/types/base'
import { enqueueMutation } from '@/repositories/sync-outbox-repository'
import { writeAuditLog } from '@/services/audit-service'

export async function persistCreate<T extends BaseEntity>(
  table: Table<T, string>,
  entityType: string,
  entity: T,
  audit: { userId: string; summary: string },
): Promise<T> {
  await db.transaction('rw', table, db.syncOutbox, db.auditLogs, async () => {
    await table.add(entity)
    await enqueueMutation({
      entityType,
      entityId: entity.id,
      operation: 'create',
      payload: entity,
      baseVersion: entity.version,
    })
    await writeAuditLog({
      entityType,
      entityId: entity.id,
      action: 'create',
      summary: audit.summary,
      userId: audit.userId,
    })
  })
  return entity
}

export async function persistUpdate<T extends BaseEntity>(
  table: Table<T, string>,
  entityType: string,
  entity: T,
  audit: { userId: string; summary: string; metadata?: Record<string, unknown> },
): Promise<T> {
  await db.transaction('rw', table, db.syncOutbox, db.auditLogs, async () => {
    await table.put(entity)
    await enqueueMutation({
      entityType,
      entityId: entity.id,
      operation: 'update',
      payload: entity,
      baseVersion: entity.version,
    })
    await writeAuditLog({
      entityType,
      entityId: entity.id,
      action: 'update',
      summary: audit.summary,
      userId: audit.userId,
      metadata: audit.metadata,
    })
  })
  return entity
}

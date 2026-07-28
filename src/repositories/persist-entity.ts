import type { Table } from 'dexie'
import { db } from '@/db/astra-db'
import { validateEntity } from '@/db/entity-schemas'
import { diffEntities } from '@/domain/audit-diff'
import type { BaseEntity } from '@/types/base'
import { enqueueMutation } from '@/repositories/sync-outbox-repository'
import { writeAuditLog } from '@/services/audit-service'
import { nowUtcIso } from '@/utils/time'

interface AuditContext {
  userId: string
  summary: string
  metadata?: Record<string, unknown>
  /** Why this change was made. Mandatory for deletes. */
  reason?: string
}

/**
 * The single write path for every aggregate (`spec.md` §3.2 rule 4).
 *
 * In one Dexie transaction it validates the entity, writes it, enqueues an
 * idempotent sync operation, and appends an audit entry carrying the actual
 * field-level change. Either all of that happens or none of it does.
 */
export async function persistCreate<T extends BaseEntity>(
  table: Table<T, string>,
  entityType: string,
  entity: T,
  audit: AuditContext,
): Promise<T> {
  // Re-validate at the repository: a bug in a form must not corrupt the
  // database (`spec.md` §7).
  validateEntity(entityType, entity)

  await db.transaction('rw', table, db.syncOutbox, db.auditLogs, async () => {
    await table.add(entity)
    const operation = await enqueueMutation({
      entityType,
      entityId: entity.id,
      operation: 'create',
      payload: entity,
      baseVersion: entity.version,
    })
    const { changedFields, newValues } = diffEntities(undefined, entity)
    await writeAuditLog({
      entityType,
      entityId: entity.id,
      action: 'create',
      summary: audit.summary,
      userId: audit.userId,
      metadata: audit.metadata,
      previousValues: null,
      newValues,
      changedFields,
      reason: audit.reason ?? null,
      source: 'user',
      operationId: operation.operationId,
    })
  })

  return entity
}

export async function persistUpdate<T extends BaseEntity>(
  table: Table<T, string>,
  entityType: string,
  entity: T,
  audit: AuditContext,
): Promise<T> {
  validateEntity(entityType, entity)

  await db.transaction('rw', table, db.syncOutbox, db.auditLogs, async () => {
    // Read the before-image inside the transaction so the diff cannot race
    // another write.
    const previous = await table.get(entity.id)
    await table.put(entity)
    const operation = await enqueueMutation({
      entityType,
      entityId: entity.id,
      operation: 'update',
      payload: entity,
      baseVersion: entity.version,
    })
    const { changedFields, previousValues, newValues } = diffEntities(previous, entity)
    await writeAuditLog({
      entityType,
      entityId: entity.id,
      action: 'update',
      summary: audit.summary,
      userId: audit.userId,
      metadata: audit.metadata,
      previousValues,
      newValues,
      changedFields,
      reason: audit.reason ?? null,
      source: 'user',
      operationId: operation.operationId,
    })
  })

  return entity
}

/**
 * Soft delete. Nothing leaves the database — `deletedAt` is stamped so history
 * stays reconstructable (`spec.md` §3.2 rule 7). A reason is required, because
 * a deletion nobody can explain is the audit entry that always gets questioned
 * later.
 */
export async function persistDelete<T extends BaseEntity>(
  table: Table<T, string>,
  entityType: string,
  entity: T,
  audit: AuditContext & { reason: string },
): Promise<T> {
  if (!audit.reason.trim()) {
    throw new Error('A reason is required to delete a record')
  }

  const timestamp = nowUtcIso()
  const deleted: T = {
    ...entity,
    deletedAt: timestamp,
    updatedAt: timestamp,
    updatedBy: audit.userId,
    version: entity.version + 1,
    syncStatus: 'pending',
  }

  await db.transaction('rw', table, db.syncOutbox, db.auditLogs, async () => {
    const previous = await table.get(entity.id)
    await table.put(deleted)
    const operation = await enqueueMutation({
      entityType,
      entityId: entity.id,
      operation: 'delete',
      payload: deleted,
      baseVersion: deleted.version,
    })
    const { changedFields, previousValues, newValues } = diffEntities(previous, deleted)
    await writeAuditLog({
      entityType,
      entityId: entity.id,
      action: 'delete',
      summary: audit.summary,
      userId: audit.userId,
      metadata: audit.metadata,
      previousValues,
      newValues,
      changedFields,
      reason: audit.reason,
      source: 'user',
      operationId: operation.operationId,
    })
  })

  return deleted
}

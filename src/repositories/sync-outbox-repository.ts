import { db } from '@/db/astra-db'
import type { SyncOutboxEntry } from '@/types/base'
import { createId } from '@/utils/id'
import { nowUtcIso } from '@/utils/time'

export interface EnqueueMutationInput {
  entityType: string
  entityId: string
  operation: SyncOutboxEntry['operation']
  payload: unknown
  baseVersion: number
}

export async function enqueueMutation(
  input: EnqueueMutationInput,
): Promise<SyncOutboxEntry> {
  const entry: SyncOutboxEntry = {
    operationId: createId(),
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    payload: input.payload,
    baseVersion: input.baseVersion,
    createdAt: nowUtcIso(),
    attemptCount: 0,
    lastError: null,
    status: 'pending',
    nextAttemptAt: null,
    dependencyOperationIds: [],
  }

  await db.syncOutbox.put(entry)
  return entry
}

export async function listPendingOutbox(): Promise<SyncOutboxEntry[]> {
  return db.syncOutbox.where('status').equals('pending').sortBy('createdAt')
}

export async function countPendingOutbox(): Promise<number> {
  return db.syncOutbox.where('status').equals('pending').count()
}

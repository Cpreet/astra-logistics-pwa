export const SYNC_STATUSES = [
  'local',
  'pending',
  'syncing',
  'synced',
  'failed',
  'conflict',
] as const

export type SyncStatus = (typeof SYNC_STATUSES)[number]

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  version: number
  syncStatus: SyncStatus
  deletedAt?: string | null
  externalRefs?: Record<string, string>
}

export const OUTBOX_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'conflict',
  'cancelled',
] as const

export type OutboxStatus = (typeof OUTBOX_STATUSES)[number]

export interface SyncOutboxEntry {
  operationId: string
  entityType: string
  entityId: string
  operation: 'create' | 'update' | 'delete'
  payload: unknown
  baseVersion: number
  createdAt: string
  attemptCount: number
  lastError?: string | null
  status: OutboxStatus
  /** ISO timestamp when the next retry may run (P9-01). */
  nextAttemptAt?: string | null
  /** Operations that must complete before this one drains. */
  dependencyOperationIds?: string[]
}

export interface SyncMetadata {
  id: string
  deviceId: string
  lastSyncAt?: string | null
  updatedAt: string
  sequenceBlockStart?: number
  sequenceBlockEnd?: number
  sequenceBlockCursor?: number
}

export interface SyncConflict {
  id: string
  entityType: string
  entityId: string
  localVersion: number
  remoteVersion: number
  localSnapshot: unknown
  remoteSnapshot: unknown
  differingFields: string[]
  status: 'open' | 'resolved'
  resolution?: 'keep_local' | 'accept_remote' | 'merge' | null
  resolutionNote?: string | null
  resolvedBy?: string | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface NumberSequence {
  id: string
  sequenceKey: string
  prefix: string
  year: number
  nextValue: number
  blockStart: number
  blockEnd: number
  updatedAt: string
}

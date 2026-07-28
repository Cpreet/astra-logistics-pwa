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
}

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
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface SyncMetadata {
  id: string
  deviceId: string
  lastSyncAt?: string | null
  updatedAt: string
}

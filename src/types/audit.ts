export interface AuditLogEntry {
  id: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete' | 'transition'
  summary: string
  /** Actor user id — kept as `userId` to match the existing code path. */
  userId: string
  createdAt: string
  metadata?: Record<string, unknown>
  /** Partial before-image of the mutation (brief §6.18). */
  previousValues?: Record<string, unknown> | null
  /** Partial after-image of the mutation. */
  newValues?: Record<string, unknown> | null
  changedFields?: string[]
  reason?: string | null
  source?: 'user' | 'system' | 'sync'
  /** Links this audit row to the sync outbox operation it produced. */
  operationId?: string | null
}

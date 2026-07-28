export interface AuditLogEntry {
  id: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete' | 'transition'
  summary: string
  userId: string
  createdAt: string
  metadata?: Record<string, unknown>
}

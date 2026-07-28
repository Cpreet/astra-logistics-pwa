import type { BaseEntity } from '@/types/base'

export interface Incident extends BaseEntity {
  incidentNumber: string
  shipmentId?: string | null
  module: string
  errorCode: string
  title: string
  description: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  status:
    | 'open'
    | 'acknowledged'
    | 'investigating'
    | 'waiting_for_customer'
    | 'resolved'
    | 'closed'
  detectedAt: string
  acknowledgedAt?: string | null
  assignedTo?: string | null
  automaticActions: string[]
  escalationAt?: string | null
  rootCauseCode?: string | null
  resolution?: string | null
  resolvedAt?: string | null
  resolvedBy?: string | null
  closedAt?: string | null
  metadata?: Record<string, unknown>
}

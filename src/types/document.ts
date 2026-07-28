import type { BaseEntity } from '@/types/base'

export interface DocumentRecord extends BaseEntity {
  shipmentId: string
  documentType: string
  fileName: string
  mimeType: string
  sizeBytes: number
  checksum: string
  localBlobKey?: string | null
  ocrStatus: 'none' | 'pending' | 'completed' | 'failed' | 'verified' | 'rejected'
  ocrResult?: Record<string, unknown> | null
  simulated: boolean
  verifiedBy?: string | null
  verifiedAt?: string | null
}

export interface DocumentDiscrepancy extends BaseEntity {
  shipmentId: string
  field: string
  sourceA: string
  valueA: string
  sourceB: string
  valueB: string
  severity: 'info' | 'warning' | 'error'
  status: 'open' | 'resolved' | 'accepted'
  resolution?: string | null
  resolvedBy?: string | null
}

export interface ComplianceCheck extends BaseEntity {
  shipmentId: string
  checkType: string
  status: 'pending' | 'passed' | 'warning' | 'failed' | 'overridden'
  severity: 'info' | 'warning' | 'error'
  ruleCode: string
  message: string
  checkedAt: string
  checkedBy: string
  resolvedAt?: string | null
  resolvedBy?: string | null
  resolution?: string | null
  metadata?: Record<string, unknown>
}

export interface DgChecklistItem extends BaseEntity {
  shipmentId: string
  itemCode: string
  label: string
  required: boolean
  result: 'pass' | 'fail' | 'na' | 'pending'
  note?: string | null
  checkedBy?: string | null
  checkedAt?: string | null
}

export interface CustomsFiling extends BaseEntity {
  shipmentId: string
  filingType: 'ens_ics2' | 'ams' | 'export_declaration' | 'import_declaration' | 'transit'
  houseLevel: boolean
  status: 'draft' | 'ready' | 'submitted' | 'accepted' | 'rejected' | 'amended' | 'cancelled'
  mrn?: string | null
  submittedAt?: string | null
  respondedAt?: string | null
  rejectionCodes: string[]
  payloadSnapshot?: Record<string, unknown> | null
  filedBy?: string | null
  simulated: boolean
  amendsFilingId?: string | null
}

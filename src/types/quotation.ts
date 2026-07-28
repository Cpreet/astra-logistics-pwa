import type { BaseEntity } from '@/types/base'
import type { LocationRef, TradeDirection, TransportMode } from '@/types/inquiry'

export const QUOTATION_STATUSES = [
  'draft',
  'pricing_review',
  'approved',
  'sent',
  'accepted',
  'rejected',
  'expired',
  'revised',
  'converted',
  'cancelled',
] as const

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number]

export interface QuotationCargo {
  summary: string
  pieces?: number | null
  grossWeightKg?: number | null
  chargeableWeightKg?: number | null
  volumeCbm?: number | null
}

export interface Quotation extends BaseEntity {
  quotationNumber: string
  quotationGroupId: string
  revision: number
  customerId: string
  inquiryId: string
  transportMode: TransportMode
  direction: TradeDirection
  origin: LocationRef
  destination: LocationRef
  cargo: QuotationCargo
  currency: string
  /** FX snapshot: major units of quote currency per 1 major unit of base, scaled. */
  exchangeRateScaled: number
  exchangeRateScale: number
  validFrom: string
  validUntil: string
  buyTotalMinor: number
  sellTotalMinor: number
  taxTotalMinor: number
  marginAmountMinor: number
  /** Basis points of sell (1% = 100). */
  marginBps: number
  terms?: string | null
  notes?: string | null
  status: QuotationStatus
  approvalRequired: boolean
  approvedBy?: string | null
  approvedAt?: string | null
  sentAt?: string | null
  serviceLevel?: string | null
}

export interface QuotationLine extends BaseEntity {
  quotationId: string
  chargeCode: string
  description: string
  category: string
  unit: string
  quantityScaled: number
  quantityScale: number
  buyRateMinor: number
  sellRateMinor: number
  taxRateBps: number
  buyAmountMinor: number
  sellAmountMinor: number
  marginAmountMinor: number
  isDisbursement: boolean
  sequence: number
}

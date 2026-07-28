import type { BaseEntity } from '@/types/base'

export const INQUIRY_STATUSES = [
  'new',
  'qualified',
  'quotation_in_progress',
  'quoted',
  'converted',
  'lost',
  'cancelled',
] as const

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number]

export const TRANSPORT_MODES = ['air', 'sea', 'road', 'rail', 'courier'] as const
export type TransportMode = (typeof TRANSPORT_MODES)[number]

export const TRADE_DIRECTIONS = ['import', 'export', 'domestic'] as const
export type TradeDirection = (typeof TRADE_DIRECTIONS)[number]

export interface LocationRef {
  code: string
  name: string
  countryCode: string
}

export interface Inquiry extends BaseEntity {
  inquiryNumber: string
  customerId: string
  transportMode: TransportMode
  direction: TradeDirection
  origin: LocationRef
  destination: LocationRef
  cargoSummary: string
  requestedPickupDate?: string | null
  requestedDeliveryDate?: string | null
  specialInstructions?: string | null
  assignedSalesUserId: string
  status: InquiryStatus
}

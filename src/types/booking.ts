import type { BaseEntity } from '@/types/base'
import type { LocationRef, TradeDirection, TransportMode } from '@/types/inquiry'

export const BOOKING_STATUSES = [
  'draft',
  'confirmed',
  'converted_to_shipment',
  'cancelled',
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export interface CommercialSnapshot {
  currency: string
  exchangeRateScaled: number
  exchangeRateScale: number
  buyTotalMinor: number
  sellTotalMinor: number
  taxTotalMinor: number
  serviceLevel?: string | null
  lines: Array<{
    chargeCode: string
    description: string
    buyAmountMinor: number
    sellAmountMinor: number
    isDisbursement: boolean
  }>
}

export interface Booking extends BaseEntity {
  bookingNumber: string
  quotationId: string
  customerId: string
  customerReference?: string | null
  shipperId?: string | null
  consigneeId?: string | null
  transportMode: TransportMode
  direction: TradeDirection
  bookingDate: string
  requestedPickupDate?: string | null
  requestedDeliveryDate?: string | null
  commercialSnapshot: CommercialSnapshot
  status: BookingStatus
  origin: LocationRef
  destination: LocationRef
}

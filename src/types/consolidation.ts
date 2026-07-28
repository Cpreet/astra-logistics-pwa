import type { BaseEntity } from '@/types/base'
import type { LocationRef } from '@/types/inquiry'

export interface Consolidation extends BaseEntity {
  consolNumber: string
  mawb?: string | null
  carrierId?: string | null
  flightNumber?: string | null
  flightDate?: string | null
  origin: LocationRef
  destination: LocationRef
  allotmentReference?: string | null
  status: 'open' | 'closed' | 'departed' | 'cancelled'
  plannedPieces: number
  plannedWeightKg: number
  plannedVolumeCbm: number
  actualPieces: number
  actualWeightKg: number
  actualVolumeCbm: number
  buyCostTotalMinor: number
  currency: string
  allocationBasis: 'chargeable_weight' | 'pieces' | 'volume' | 'manual'
  allocationRevision: number
}

export interface CostAllocation {
  id: string
  consolidationId: string
  shipmentId: string
  revision: number
  basis: Consolidation['allocationBasis']
  basisValue: number
  allocatedAmountMinor: number
  currency: string
  allocatedBy: string
  allocatedAt: string
}

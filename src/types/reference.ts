import type { BaseEntity } from '@/types/base'
import type { TradeDirection, TransportMode } from '@/types/inquiry'
import type { UserRole } from '@/types/user'

export interface Carrier extends BaseEntity {
  carrierCode: string
  name: string
  carrierType: 'airline' | 'shipping_line' | 'road_carrier' | 'rail_operator' | 'courier'
  serviceRegions: string[]
  contactDetails?: string | null
  active: boolean
  reliabilityScore: number
  averageDelayMinutes: number
  costScore: number
  slaPerformance: number
}

export interface Warehouse extends BaseEntity {
  warehouseCode: string
  name: string
  address: string
  airportOrPortCode: string
  capacity?: number | null
  contactDetails?: string | null
  active: boolean
}

export interface LocationRecord {
  id: string
  code: string
  name: string
  countryCode: string
  type: 'airport' | 'seaport' | 'rail_terminal' | 'road_hub' | 'other'
  timezone?: string | null
}

export interface RateCard extends BaseEntity {
  name: string
  carrierId?: string | null
  transportMode: TransportMode
  serviceLevel?: string | null
  originCode: string
  destinationCode: string
  validFrom: string
  validUntil: string
  currency: string
  active: boolean
}

export interface RateLine extends BaseEntity {
  rateCardId: string
  chargeCode: string
  minWeightKg: number
  maxWeightKg: number
  buyRateMinor: number
  sellRateMinor: number
  minimumChargeMinor: number
  unit: string
}

export interface LaneRule extends BaseEntity {
  originCountry: string
  destinationCountry: string
  direction: TradeDirection
  transportMode: TransportMode
  requiredDocumentTypes: string[]
  requiredFilingTypes: string[]
  screeningRequired: boolean
  notes?: string | null
}

export interface RouteMapTemplate extends BaseEntity {
  name: string
  transportMode: TransportMode
  direction: TradeDirection
  serviceLevel?: string | null
  milestones: Array<{
    sequence: number
    code: string
    label: string
    offsetMinutes: number
    slaOffsetMinutes: number
    responsibleRole?: UserRole | null
  }>
  active: boolean
}

export interface ExceptionRoutingRule extends BaseEntity {
  name: string
  condition: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  targetRole: UserRole
  active: boolean
}

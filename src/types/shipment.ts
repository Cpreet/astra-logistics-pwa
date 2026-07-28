import type { BaseEntity } from '@/types/base'
import type { LocationRef, TradeDirection, TransportMode } from '@/types/inquiry'

export const SHIPMENT_STATUSES = [
  'draft',
  'created',
  'documents_pending',
  'documents_under_review',
  'compliance_review',
  'compliance_hold',
  'ready_for_carrier_booking',
  'carrier_booked',
  'pickup_scheduled',
  'picked_up',
  'warehouse_received',
  'export_customs',
  'customs_cleared',
  'departed',
  'in_transit',
  'arrived',
  'import_customs',
  'delivery_scheduled',
  'out_for_delivery',
  'delivered',
  'proof_of_delivery_received',
  'billing_pending',
  'financially_closed',
  'closed',
  'cancelled',
] as const

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]

export interface Shipment extends BaseEntity {
  shipmentNumber: string
  jobNumber: string
  referenceNumber?: string | null
  bookingId?: string | null
  quotationId?: string | null
  customerId: string
  shipperId?: string | null
  consigneeId?: string | null
  transportMode: TransportMode
  direction: TradeDirection
  shipmentType: 'direct' | 'house'
  consolidationId?: string | null
  awbMode: 'eawb' | 'paper'
  serviceLevel?: string | null
  incoterm?: string | null
  origin: LocationRef
  destination: LocationRef
  carrierId?: string | null
  warehouseId?: string | null
  flightNumber?: string | null
  flightDate?: string | null
  mawb?: string | null
  hawb?: string | null
  vesselName?: string | null
  voyageNumber?: string | null
  containerNumbers: string[]
  estimatedDepartureAt?: string | null
  actualDepartureAt?: string | null
  estimatedArrivalAt?: string | null
  actualArrivalAt?: string | null
  expectedDeliveryAt?: string | null
  deliveredAt?: string | null
  status: ShipmentStatus
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'normal'
  priorityScore: number
  complianceStatus: 'clear' | 'warning' | 'hold' | 'pending'
  documentationStatus: 'complete' | 'incomplete' | 'pending_review'
  financialStatus: 'open' | 'invoiced' | 'paid' | 'closed'
  securityStatus: 'known_consignor' | 'account_consignor' | 'unknown'
  screeningMethod?: string | null
  securityDeclarationRef?: string | null
  carrierSelectionRationale?: string | null
  co2EstimateKg?: number | null
  assignedOperationsUserId?: string | null
  slaTargetAt?: string | null
  delayMinutes?: number | null
  notes?: string | null
}

export interface Cargo extends BaseEntity {
  shipmentId: string
  commodityDescription: string
  hsCode?: string | null
  pieces: number
  packageType: string
  grossWeightKg: number
  chargeableWeightKg: number
  volumetricWeightKg: number
  volumeCbm: number
  declaredValueMinor?: number | null
  currency: string
  dangerousGoods: boolean
  dangerousGoodsClass?: string | null
  unNumber?: string | null
  packingGroup?: string | null
  packingInstruction?: string | null
  temperatureControlled: boolean
  minimumTemperature?: number | null
  maximumTemperature?: number | null
  stackable: boolean
  specialHandlingInstructions?: string | null
}

export interface CargoPiece extends BaseEntity {
  cargoId: string
  sequence: number
  pieces: number
  lengthCm: number
  widthCm: number
  heightCm: number
  grossWeightKg: number
  marks?: string | null
  receivedWeightKg?: number | null
  condition?: string | null
}

export interface RouteMap extends BaseEntity {
  shipmentId: string
  templateId?: string | null
  revision: number
  plannedAt: string
  replanReason?: string | null
  status: 'active' | 'superseded'
}

export interface RouteMapMilestone extends BaseEntity {
  routeMapId: string
  sequence: number
  code: string
  label: string
  plannedAt: string
  actualAt?: string | null
  slaOffsetMinutes: number
  varianceMinutes?: number | null
  status: 'planned' | 'met' | 'at_risk' | 'missed' | 'skipped'
  responsibleRole?: string | null
}

export interface ShipmentEvent {
  id: string
  shipmentId: string
  eventType: string
  eventCode: string
  title: string
  description?: string | null
  location?: string | null
  occurredAt: string
  recordedAt: string
  source: 'manual' | 'carrier_api' | 'gps' | 'system' | 'customer' | 'simulated'
  sourceReference?: string | null
  latitude?: number | null
  longitude?: number | null
  visibility: 'internal' | 'customer' | 'both'
  createdBy: string
  metadata?: Record<string, unknown>
}

export interface ShipmentNote {
  id: string
  shipmentId: string
  body: string
  authorId: string
  visibility: 'internal' | 'customer'
  createdAt: string
  editedAt?: string | null
  mentions: string[]
}

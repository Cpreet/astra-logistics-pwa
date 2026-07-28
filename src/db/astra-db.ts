import Dexie, { type Table } from 'dexie'
import type { AuditLogEntry } from '@/types/audit'
import type { Booking } from '@/types/booking'
import type {
  NumberSequence,
  SyncConflict,
  SyncMetadata,
  SyncOutboxEntry,
} from '@/types/base'
import type { Consolidation, CostAllocation } from '@/types/consolidation'
import type { Customer, CustomerContact } from '@/types/customer'
import type {
  ComplianceCheck,
  CustomsFiling,
  DgChecklistItem,
  DocumentDiscrepancy,
  DocumentRecord,
} from '@/types/document'
import type { Charge, Invoice, Payment } from '@/types/finance'
import type { Incident } from '@/types/incident'
import type { Inquiry } from '@/types/inquiry'
import type { Notification } from '@/types/notification'
import type { Quotation, QuotationLine } from '@/types/quotation'
import type {
  Carrier,
  ExceptionRoutingRule,
  LaneRule,
  LocationRecord,
  RateCard,
  RateLine,
  RouteMapTemplate,
  Warehouse,
} from '@/types/reference'
import type {
  Cargo,
  CargoPiece,
  RouteMap,
  RouteMapMilestone,
  Shipment,
  ShipmentEvent,
  ShipmentNote,
} from '@/types/shipment'
import type { User } from '@/types/user'

export interface AppSettingRow {
  key: string
  value: unknown
  updatedAt: string
}

const V1_STORES = {
  syncOutbox: 'operationId, entityType, entityId, status, createdAt',
  syncMetadata: 'id',
  appSettings: 'key',
} as const

const V2_STORES = {
  ...V1_STORES,
  users: 'id, email, role, active',
  customers: 'id, customerCode, status, legalName, syncStatus, deletedAt, updatedAt',
  customerContacts: 'id, customerId, syncStatus, deletedAt',
  inquiries:
    'id, inquiryNumber, customerId, status, transportMode, assignedSalesUserId, syncStatus, deletedAt, updatedAt',
  auditLogs: 'id, entityType, entityId, createdAt',
  notifications: 'id, userId, status, createdAt, shipmentId',
} as const

/** Full domain schema from `spec.md` §5 — tables beyond v2 land here. */
const V3_STORES = {
  ...V2_STORES,
  syncOutbox: 'operationId, entityType, entityId, status, createdAt, nextAttemptAt',
  quotations:
    'id, quotationNumber, quotationGroupId, inquiryId, customerId, status, [customerId+status], syncStatus, deletedAt, updatedAt',
  quotationLines: 'id, quotationId, chargeCode, syncStatus, deletedAt',
  bookings: 'id, bookingNumber, quotationId, customerId, status, syncStatus, deletedAt, updatedAt',
  shipments:
    'id, shipmentNumber, jobNumber, customerId, status, [customerId+status], [status+updatedAt], consolidationId, syncStatus, deletedAt, updatedAt',
  cargo: 'id, shipmentId, syncStatus, deletedAt',
  cargoPieces: 'id, cargoId, sequence, syncStatus, deletedAt',
  consolidations: 'id, consolNumber, status, carrierId, syncStatus, deletedAt, updatedAt',
  costAllocations: 'id, consolidationId, shipmentId, revision',
  routeMaps: 'id, shipmentId, revision, status, syncStatus, deletedAt',
  routeMapMilestones: 'id, routeMapId, sequence, status, syncStatus, deletedAt',
  shipmentEvents: 'id, shipmentId, eventCode, occurredAt, sourceReference',
  shipmentNotes: 'id, shipmentId, visibility, createdAt',
  documents: 'id, shipmentId, documentType, checksum, ocrStatus, syncStatus, deletedAt',
  documentDiscrepancies: 'id, shipmentId, status, severity, syncStatus, deletedAt',
  complianceChecks: 'id, shipmentId, checkType, status, syncStatus, deletedAt',
  dgChecklistItems: 'id, shipmentId, itemCode, result, syncStatus, deletedAt',
  customsFilings: 'id, shipmentId, filingType, status, syncStatus, deletedAt',
  charges: 'id, shipmentId, quotationId, chargeCode, costBasis, syncStatus, deletedAt',
  invoices:
    'id, invoiceNumber, shipmentId, customerId, status, [customerId+status], syncStatus, deletedAt, updatedAt',
  payments: 'id, paymentNumber, invoiceId, customerId, status, syncStatus, deletedAt',
  incidents:
    'id, incidentNumber, shipmentId, priority, status, [status+updatedAt], syncStatus, deletedAt, updatedAt',
  carriers: 'id, carrierCode, carrierType, active, syncStatus, deletedAt',
  warehouses: 'id, warehouseCode, airportOrPortCode, active, syncStatus, deletedAt',
  locations: 'id, code, countryCode, type',
  rateCards: 'id, originCode, destinationCode, transportMode, validUntil, active, syncStatus, deletedAt',
  rateLines: 'id, rateCardId, chargeCode, syncStatus, deletedAt',
  laneRules: 'id, originCountry, destinationCountry, transportMode, syncStatus, deletedAt',
  routeMapTemplates: 'id, transportMode, direction, active, syncStatus, deletedAt',
  exceptionRoutingRules: 'id, priority, targetRole, active, syncStatus, deletedAt',
  syncConflicts: 'id, entityType, entityId, status, createdAt, updatedAt',
  numberSequences: 'id, sequenceKey, year',
} as const

export class AstraDatabase extends Dexie {
  syncOutbox!: Table<SyncOutboxEntry, string>
  syncMetadata!: Table<SyncMetadata, string>
  appSettings!: Table<AppSettingRow, string>
  users!: Table<User, string>
  customers!: Table<Customer, string>
  customerContacts!: Table<CustomerContact, string>
  inquiries!: Table<Inquiry, string>
  auditLogs!: Table<AuditLogEntry, string>
  notifications!: Table<Notification, string>
  quotations!: Table<Quotation, string>
  quotationLines!: Table<QuotationLine, string>
  bookings!: Table<Booking, string>
  shipments!: Table<Shipment, string>
  cargo!: Table<Cargo, string>
  cargoPieces!: Table<CargoPiece, string>
  consolidations!: Table<Consolidation, string>
  costAllocations!: Table<CostAllocation, string>
  routeMaps!: Table<RouteMap, string>
  routeMapMilestones!: Table<RouteMapMilestone, string>
  shipmentEvents!: Table<ShipmentEvent, string>
  shipmentNotes!: Table<ShipmentNote, string>
  documents!: Table<DocumentRecord, string>
  documentDiscrepancies!: Table<DocumentDiscrepancy, string>
  complianceChecks!: Table<ComplianceCheck, string>
  dgChecklistItems!: Table<DgChecklistItem, string>
  customsFilings!: Table<CustomsFiling, string>
  charges!: Table<Charge, string>
  invoices!: Table<Invoice, string>
  payments!: Table<Payment, string>
  incidents!: Table<Incident, string>
  carriers!: Table<Carrier, string>
  warehouses!: Table<Warehouse, string>
  locations!: Table<LocationRecord, string>
  rateCards!: Table<RateCard, string>
  rateLines!: Table<RateLine, string>
  laneRules!: Table<LaneRule, string>
  routeMapTemplates!: Table<RouteMapTemplate, string>
  exceptionRoutingRules!: Table<ExceptionRoutingRule, string>
  syncConflicts!: Table<SyncConflict, string>
  numberSequences!: Table<NumberSequence, string>

  constructor(name = 'astra') {
    super(name)

    this.version(1).stores(V1_STORES)
    this.version(2).stores(V2_STORES)
    this.version(3).stores(V3_STORES)
  }
}

export const db = new AstraDatabase()

/** Domain tables added (or re-indexed) in schema v3. */
export const V3_NEW_TABLE_NAMES = [
  'quotations',
  'quotationLines',
  'bookings',
  'shipments',
  'cargo',
  'cargoPieces',
  'consolidations',
  'costAllocations',
  'routeMaps',
  'routeMapMilestones',
  'shipmentEvents',
  'shipmentNotes',
  'documents',
  'documentDiscrepancies',
  'complianceChecks',
  'dgChecklistItems',
  'customsFilings',
  'charges',
  'invoices',
  'payments',
  'incidents',
  'carriers',
  'warehouses',
  'locations',
  'rateCards',
  'rateLines',
  'laneRules',
  'routeMapTemplates',
  'exceptionRoutingRules',
  'syncConflicts',
  'numberSequences',
] as const

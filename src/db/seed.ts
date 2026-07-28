import { db } from '@/db/astra-db'
import { createCustomer } from '@/repositories/customer-repository'
import { createInquiry } from '@/repositories/inquiry-repository'
import { upsertUser } from '@/repositories/user-repository'
import type { User } from '@/types/user'
import { createId } from '@/utils/id'
import { nowUtcIso } from '@/utils/time'

const SEED_VERSION_KEY = 'data_seed_version'
const CURRENT_SEED_VERSION = 2

function demoUser(id: string, name: string, email: string, role: User['role']): User {
  return { id, name, email, role, active: true, avatarUrl: null, lastLoginAt: null }
}

const DEMO_USERS: User[] = [
  demoUser('user-sales-demo', 'Sam Rivera', 'sales@astra.demo', 'sales_executive'),
  demoUser('user-ops-demo', 'Olivia Nkemi', 'ops@astra.demo', 'operations_executive'),
  demoUser('user-pricing-demo', 'Priya Raman', 'pricing@astra.demo', 'pricing_executive'),
  demoUser('user-docs-demo', 'Diego Marín', 'docs@astra.demo', 'documentation_executive'),
  demoUser('user-compliance-demo', 'Chen Wei', 'compliance@astra.demo', 'compliance_officer'),
  demoUser('user-warehouse-demo', 'Wanda Boateng', 'warehouse@astra.demo', 'warehouse_executive'),
  demoUser('user-finance-demo', 'Farah Haddad', 'finance@astra.demo', 'finance_executive'),
  demoUser('user-manager-demo', 'Marco Silva', 'manager@astra.demo', 'manager'),
  demoUser('user-admin-demo', 'Alex Whitfield', 'admin@astra.demo', 'administrator'),
  demoUser('user-customer-demo', 'Jordan Lee', 'portal@astra.demo', 'customer'),
]

export async function runSeedIfNeeded(): Promise<void> {
  const existing = await db.appSettings.get(SEED_VERSION_KEY)
  if (existing?.value === CURRENT_SEED_VERSION) {
    return
  }

  for (const user of DEMO_USERS) {
    await upsertUser(user)
  }

  const salesUserId = DEMO_USERS[0].id

  const { customer: acme } = await createCustomer(salesUserId, {
    legalName: 'Acme Aero Components Ltd',
    tradingName: 'Acme Aero',
    customerType: 'shipper',
    taxIdentifier: 'GB123456789',
    registrationNumber: 'AC-9981',
    creditLimit: 250_000,
    paymentTermsDays: 30,
    currency: 'USD',
    status: 'active',
    billingAddress: {
      line1: '120 Heathrow Logistics Park',
      city: 'London',
      postalCode: 'TW6 1AP',
      countryCode: 'GB',
    },
    shippingAddresses: [],
    complianceStatus: 'clear',
    notes: 'Preferred air export customer — demo seed',
    contactName: 'Jordan Lee',
    contactEmail: 'jordan@acmeaero.demo',
    contactPhone: '+44 20 7946 0123',
  })

  const { customer: pacific } = await createCustomer(salesUserId, {
    legalName: 'Pacific Retail Imports Inc',
    tradingName: 'Pacific Retail',
    customerType: 'consignee',
    taxIdentifier: 'US-PR-4412',
    registrationNumber: null,
    creditLimit: 120_000,
    paymentTermsDays: 45,
    currency: 'USD',
    status: 'lead',
    billingAddress: {
      line1: '500 Market Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      countryCode: 'US',
    },
    shippingAddresses: [],
    complianceStatus: 'review',
    notes: null,
    contactName: 'Morgan Chen',
    contactEmail: 'morgan@pacificretail.demo',
  })

  const stalled = await createInquiry(salesUserId, {
    customerId: acme.id,
    transportMode: 'air',
    direction: 'export',
    origin: { code: 'LHR', name: 'London Heathrow', countryCode: 'GB' },
    destination: { code: 'JFK', name: 'New York JFK', countryCode: 'US' },
    cargoSummary: '12 pallets — aerospace spare parts, non-DG',
    requestedPickupDate: isoDaysFromNow(6),
    requestedDeliveryDate: isoDaysFromNow(9),
    specialInstructions: 'Temperature monitoring not required',
    assignedSalesUserId: salesUserId,
  })

  const imminent = await createInquiry(salesUserId, {
    customerId: pacific.id,
    transportMode: 'air',
    direction: 'import',
    origin: { code: 'HKG', name: 'Hong Kong', countryCode: 'HK' },
    destination: { code: 'LAX', name: 'Los Angeles', countryCode: 'US' },
    cargoSummary: 'Garments — 8 cartons, chargeable weight to confirm',
    requestedPickupDate: isoDaysFromNow(1),
    requestedDeliveryDate: null,
    specialInstructions: null,
    assignedSalesUserId: salesUserId,
  })

  const idle = await createInquiry(salesUserId, {
    customerId: acme.id,
    transportMode: 'air',
    direction: 'export',
    origin: { code: 'FRA', name: 'Frankfurt', countryCode: 'DE' },
    destination: { code: 'SIN', name: 'Singapore Changi', countryCode: 'SG' },
    cargoSummary: '3 crates — calibration equipment, 480 kg',
    requestedPickupDate: isoDaysFromNow(14),
    requestedDeliveryDate: null,
    specialInstructions: 'Customer asked for two rate options',
    assignedSalesUserId: salesUserId,
  })

  // Backdate a few records so the attention queue demonstrates real exceptions.
  await db.inquiries.update(stalled.id, {
    status: 'quotation_in_progress',
    updatedAt: isoDaysFromNow(-3),
  })
  await db.inquiries.update(idle.id, { updatedAt: isoDaysFromNow(-5) })
  await db.inquiries.update(imminent.id, { updatedAt: isoDaysFromNow(-1) })

  await backdateSeedAuditTrail()

  await db.appSettings.put({
    key: SEED_VERSION_KEY,
    value: CURRENT_SEED_VERSION,
    updatedAt: nowUtcIso(),
  })
}

function isoDaysFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

/**
 * Seeding writes its audit entries in one burst, so the activity feed would
 * otherwise show six identical "1 second ago" rows — which reads as fake data
 * rather than a workspace with history. Spread them over the preceding days,
 * oldest first, matching the order they were created in.
 */
async function backdateSeedAuditTrail(): Promise<void> {
  const entries = await db.auditLogs.orderBy('createdAt').toArray()
  const spacingMinutes = [7 * 24 * 60, 5 * 24 * 60, 3 * 24 * 60, 26 * 60, 5 * 60, 90]

  await Promise.all(
    entries.map((entry, index) => {
      const minutesAgo = spacingMinutes[Math.min(index, spacingMinutes.length - 1)] ?? 60
      const at = new Date(Date.now() - minutesAgo * 60_000).toISOString()
      return db.auditLogs.update(entry.id, { createdAt: at })
    }),
  )
}

/** Clears operational demo records so a user can start from an empty workspace. */
export async function clearDemoData(): Promise<void> {
  await db.customers.clear()
  await db.customerContacts.clear()
  await db.inquiries.clear()
  await db.auditLogs.clear()
  await db.notifications.clear()
  await db.syncOutbox.clear()
  await db.appSettings.delete('activation_state')
  await db.appSettings.delete('activation_dismissed')
}

/** Restores the demo dataset from scratch. */
export async function reloadDemoData(): Promise<void> {
  await clearDemoData()
  await db.appSettings.delete(SEED_VERSION_KEY)
  await runSeedIfNeeded()
}

export { DEMO_USERS }

export const DEMO_SESSION_KEY = 'demo_session'

export interface DemoSession {
  userId: string
  signedInAt: string
  sessionId: string
}

export async function saveDemoSession(userId: string): Promise<DemoSession> {
  const session: DemoSession = {
    userId,
    signedInAt: nowUtcIso(),
    sessionId: createId(),
  }
  await db.appSettings.put({
    key: DEMO_SESSION_KEY,
    value: session,
    updatedAt: nowUtcIso(),
  })
  return session
}

export async function loadDemoSession(): Promise<DemoSession | null> {
  const row = await db.appSettings.get(DEMO_SESSION_KEY)
  if (!row?.value) return null
  return row.value as DemoSession
}

export async function clearDemoSession(): Promise<void> {
  await db.appSettings.delete(DEMO_SESSION_KEY)
}

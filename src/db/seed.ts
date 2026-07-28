import { db } from '@/db/astra-db'
import { createCustomer } from '@/repositories/customer-repository'
import { createInquiry } from '@/repositories/inquiry-repository'
import { upsertUser } from '@/repositories/user-repository'
import type { User } from '@/types/user'
import { createId } from '@/utils/id'
import { nowUtcIso } from '@/utils/time'

const SEED_VERSION_KEY = 'data_seed_version'
const CURRENT_SEED_VERSION = 1

const DEMO_USERS: User[] = [
  {
    id: 'user-admin-demo',
    name: 'Alex Admin',
    email: 'admin@astra.demo',
    role: 'administrator',
    active: true,
    avatarUrl: null,
    lastLoginAt: null,
  },
  {
    id: 'user-sales-demo',
    name: 'Sam Sales',
    email: 'sales@astra.demo',
    role: 'sales_executive',
    active: true,
    avatarUrl: null,
    lastLoginAt: null,
  },
  {
    id: 'user-ops-demo',
    name: 'Olivia Ops',
    email: 'ops@astra.demo',
    role: 'operations_executive',
    active: true,
    avatarUrl: null,
    lastLoginAt: null,
  },
]

export async function runSeedIfNeeded(): Promise<void> {
  const existing = await db.appSettings.get(SEED_VERSION_KEY)
  if (existing?.value === CURRENT_SEED_VERSION) {
    return
  }

  for (const user of DEMO_USERS) {
    await upsertUser(user)
  }

  const salesUserId = DEMO_USERS[1].id

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

  await createInquiry(salesUserId, {
    customerId: acme.id,
    transportMode: 'air',
    direction: 'export',
    origin: { code: 'LHR', name: 'London Heathrow', countryCode: 'GB' },
    destination: { code: 'JFK', name: 'New York JFK', countryCode: 'US' },
    cargoSummary: '12 pallets — aerospace spare parts, non-DG',
    requestedPickupDate: '2026-08-05',
    requestedDeliveryDate: '2026-08-08',
    specialInstructions: 'Temperature monitoring not required',
    assignedSalesUserId: salesUserId,
  })

  await createInquiry(salesUserId, {
    customerId: pacific.id,
    transportMode: 'air',
    direction: 'import',
    origin: { code: 'HKG', name: 'Hong Kong', countryCode: 'HK' },
    destination: { code: 'LAX', name: 'Los Angeles', countryCode: 'US' },
    cargoSummary: 'Garments — 8 cartons, chargeable weight TBC',
    requestedPickupDate: '2026-08-12',
    requestedDeliveryDate: null,
    specialInstructions: null,
    assignedSalesUserId: salesUserId,
  })

  await db.appSettings.put({
    key: SEED_VERSION_KEY,
    value: CURRENT_SEED_VERSION,
    updatedAt: nowUtcIso(),
  })

  await db.appSettings.put({
    key: 'demo_notice_dismissed',
    value: false,
    updatedAt: nowUtcIso(),
  })
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

import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { AstraDatabase, V3_NEW_TABLE_NAMES } from '@/db/astra-db'
import { bootstrapLocalDatabase } from '@/db/bootstrap'

/** Minimal v2-only database used to seed data before a v3 upgrade. */
class AstraDatabaseV2Only extends Dexie {
  constructor(name: string) {
    super(name)
    this.version(1).stores({
      syncOutbox: 'operationId, entityType, entityId, status, createdAt',
      syncMetadata: 'id',
      appSettings: 'key',
    })
    this.version(2).stores({
      syncOutbox: 'operationId, entityType, entityId, status, createdAt',
      syncMetadata: 'id',
      appSettings: 'key',
      users: 'id, email, role, active',
      customers: 'id, customerCode, status, legalName, syncStatus, deletedAt, updatedAt',
      customerContacts: 'id, customerId, syncStatus, deletedAt',
      inquiries:
        'id, inquiryNumber, customerId, status, transportMode, assignedSalesUserId, syncStatus, deletedAt, updatedAt',
      auditLogs: 'id, entityType, entityId, createdAt',
      notifications: 'id, userId, status, createdAt, shipmentId',
    })
  }
}

describe('Dexie schema v3 migration (P1-01)', () => {
  const dbName = 'astra-schema-v3-migration'

  beforeEach(async () => {
    await Dexie.delete(dbName)
  })

  it('upgrades a populated v2 database and preserves seeded rows', async () => {
    const v2 = new AstraDatabaseV2Only(dbName)
    await v2.open()
    expect(v2.verno).toBe(2)

    await v2.table('customers').add({
      id: 'cust-migrate-1',
      customerCode: 'CUS-00001',
      legalName: 'Migration Customer',
      tradingName: null,
      customerType: 'shipper',
      taxIdentifier: null,
      registrationNumber: null,
      creditLimit: 0,
      paymentTermsDays: 30,
      currency: 'USD',
      status: 'active',
      billingAddress: { line1: '1 Test St', city: 'London', postalCode: 'E1', countryCode: 'GB' },
      shippingAddresses: [],
      complianceStatus: 'clear',
      notes: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'user-admin-demo',
      updatedBy: 'user-admin-demo',
      version: 1,
      syncStatus: 'local',
      deletedAt: null,
    })
    await v2.table('inquiries').add({
      id: 'inq-migrate-1',
      inquiryNumber: 'INQ-00001',
      customerId: 'cust-migrate-1',
      transportMode: 'air',
      direction: 'export',
      origin: { code: 'LHR', name: 'London Heathrow', countryCode: 'GB' },
      destination: { code: 'JFK', name: 'New York JFK', countryCode: 'US' },
      cargoSummary: 'Migration cargo',
      assignedSalesUserId: 'user-sales-demo',
      status: 'new',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'user-sales-demo',
      updatedBy: 'user-sales-demo',
      version: 1,
      syncStatus: 'local',
      deletedAt: null,
    })
    await v2.close()

    const v3 = new AstraDatabase(dbName)
    await v3.open()
    expect(v3.verno).toBeGreaterThanOrEqual(3)

    const customer = await v3.customers.get('cust-migrate-1')
    const inquiry = await v3.inquiries.get('inq-migrate-1')
    expect(customer?.legalName).toBe('Migration Customer')
    expect(inquiry?.inquiryNumber).toBe('INQ-00001')

    for (const tableName of V3_NEW_TABLE_NAMES) {
      expect(v3.table(tableName), tableName).toBeTruthy()
      expect(await v3.table(tableName).count()).toBe(0)
    }

    // New tables accept writes after upgrade.
    await v3.numberSequences.add({
      id: 'seq-shipment',
      sequenceKey: 'shipment',
      prefix: 'EX/BLR',
      year: 2026,
      nextValue: 1,
      blockStart: 1,
      blockEnd: 1000,
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(await v3.numberSequences.count()).toBe(1)

    // Schema v4 inquiry messages table is present after upgrade.
    expect(v3.table('inquiryMessages')).toBeTruthy()
    expect(await v3.inquiryMessages.count()).toBe(0)

    await v3.close()
  })

  it('opens the default database at the latest schema after bootstrap', async () => {
    await dbDeleteDefault()
    const { db } = await import('@/db/astra-db')
    await db.open()
    expect(db.verno).toBeGreaterThanOrEqual(4)
    await bootstrapLocalDatabase()
    expect(await db.customers.count()).toBeGreaterThanOrEqual(2)
    expect(await db.quotations.count()).toBe(0)
    expect(await db.inquiryMessages.count()).toBeGreaterThan(0)
    expect(V3_NEW_TABLE_NAMES).toHaveLength(31)
  })
})

async function dbDeleteDefault(): Promise<void> {
  const { db } = await import('@/db/astra-db')
  await db.close()
  await db.delete()
}

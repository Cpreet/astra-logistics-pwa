import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/astra-db'
import { EntityValidationError } from '@/db/entity-schemas'
import { persistCreate, persistDelete, persistUpdate } from '@/repositories/persist-entity'
import type { Customer } from '@/types/customer'
import { createBaseEntity, touchEntity } from '@/utils/entity'

const USER_ID = 'user-1'

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    ...createBaseEntity(USER_ID),
    customerCode: 'CUS-00001',
    legalName: 'Acme Aero Components Ltd',
    tradingName: 'Acme Aero',
    customerType: 'shipper',
    taxIdentifier: null,
    registrationNumber: null,
    creditLimit: 250_000,
    paymentTermsDays: 30,
    currency: 'GBP',
    status: 'lead',
    primaryContactId: null,
    billingAddress: {
      line1: '1 Runway Road',
      city: 'London',
      postalCode: 'TW6 1AA',
      countryCode: 'GB',
    },
    shippingAddresses: [],
    complianceStatus: 'clear',
    notes: null,
    ...overrides,
  }
}

beforeEach(async () => {
  await Promise.all([db.customers.clear(), db.auditLogs.clear(), db.syncOutbox.clear()])
})

describe('persistCreate', () => {
  it('writes the entity, an outbox operation and an audit entry in one transaction', async () => {
    const customer = makeCustomer()
    await persistCreate(db.customers, 'customer', customer, {
      userId: USER_ID,
      summary: 'Customer CUS-00001 created',
    })

    expect(await db.customers.get(customer.id)).toBeDefined()
    expect(await db.syncOutbox.count()).toBe(1)
    expect(await db.auditLogs.count()).toBe(1)
  })

  it('links the audit entry to the sync operation it produced', async () => {
    const customer = makeCustomer()
    await persistCreate(db.customers, 'customer', customer, {
      userId: USER_ID,
      summary: 'created',
    })

    const [entry] = await db.auditLogs.toArray()
    const [operation] = await db.syncOutbox.toArray()
    expect(entry!.operationId).toBe(operation!.operationId)
  })

  it('records the created values with no before-image', async () => {
    const customer = makeCustomer()
    await persistCreate(db.customers, 'customer', customer, {
      userId: USER_ID,
      summary: 'created',
    })

    const [entry] = await db.auditLogs.toArray()
    expect(entry!.action).toBe('create')
    expect(entry!.previousValues).toBeNull()
    expect(entry!.newValues?.legalName).toBe('Acme Aero Components Ltd')
    expect(entry!.changedFields).toContain('legalName')
  })

  it('rejects an entity that fails its persistence schema', async () => {
    const invalid = makeCustomer({ currency: 'POUNDS', creditLimit: -5 })

    await expect(
      persistCreate(db.customers, 'customer', invalid, { userId: USER_ID, summary: 'created' }),
    ).rejects.toBeInstanceOf(EntityValidationError)
  })

  it('writes nothing at all when validation fails', async () => {
    const invalid = makeCustomer({ legalName: '' })

    await expect(
      persistCreate(db.customers, 'customer', invalid, { userId: USER_ID, summary: 'created' }),
    ).rejects.toThrow()

    expect(await db.customers.count()).toBe(0)
    expect(await db.syncOutbox.count()).toBe(0)
    expect(await db.auditLogs.count()).toBe(0)
  })
})

describe('persistUpdate', () => {
  it('records the before and after values of the changed field only', async () => {
    const customer = makeCustomer()
    await persistCreate(db.customers, 'customer', customer, {
      userId: USER_ID,
      summary: 'created',
    })
    await db.auditLogs.clear()

    const updated = touchEntity({ ...customer, status: 'active' as const }, USER_ID)
    await persistUpdate(db.customers, 'customer', updated, {
      userId: USER_ID,
      summary: 'status changed',
    })

    const [entry] = await db.auditLogs.toArray()
    expect(entry!.action).toBe('update')
    expect(entry!.changedFields).toEqual(['status'])
    expect(entry!.previousValues).toEqual({ status: 'lead' })
    expect(entry!.newValues).toEqual({ status: 'active' })
  })

  it('does not treat the version bump alone as a change', async () => {
    const customer = makeCustomer()
    await persistCreate(db.customers, 'customer', customer, {
      userId: USER_ID,
      summary: 'created',
    })
    await db.auditLogs.clear()

    await persistUpdate(db.customers, 'customer', touchEntity(customer, USER_ID), {
      userId: USER_ID,
      summary: 'no-op save',
    })

    const [entry] = await db.auditLogs.toArray()
    expect(entry!.changedFields).toEqual([])
  })

  it('stores an optional reason on the audit entry', async () => {
    const customer = makeCustomer()
    await persistCreate(db.customers, 'customer', customer, {
      userId: USER_ID,
      summary: 'created',
    })

    const updated = touchEntity({ ...customer, status: 'credit_hold' as const }, USER_ID)
    await persistUpdate(db.customers, 'customer', updated, {
      userId: USER_ID,
      summary: 'placed on credit hold',
      reason: 'Two invoices overdue by more than 60 days',
    })

    const entries = await db.auditLogs.orderBy('createdAt').toArray()
    expect(entries.at(-1)!.reason).toBe('Two invoices overdue by more than 60 days')
  })
})

describe('persistDelete', () => {
  it('soft deletes rather than removing the row', async () => {
    const customer = makeCustomer()
    await persistCreate(db.customers, 'customer', customer, {
      userId: USER_ID,
      summary: 'created',
    })

    await persistDelete(db.customers, 'customer', customer, {
      userId: USER_ID,
      summary: 'Customer removed',
      reason: 'Duplicate record',
    })

    const stored = await db.customers.get(customer.id)
    expect(stored).toBeDefined()
    expect(stored!.deletedAt).toBeTruthy()
    expect(stored!.version).toBe(customer.version + 1)
  })

  it('queues a delete operation and an audit entry carrying the reason', async () => {
    const customer = makeCustomer()
    await persistCreate(db.customers, 'customer', customer, {
      userId: USER_ID,
      summary: 'created',
    })
    await db.syncOutbox.clear()
    await db.auditLogs.clear()

    await persistDelete(db.customers, 'customer', customer, {
      userId: USER_ID,
      summary: 'Customer removed',
      reason: 'Duplicate record',
    })

    const [operation] = await db.syncOutbox.toArray()
    const [entry] = await db.auditLogs.toArray()
    expect(operation!.operation).toBe('delete')
    expect(entry!.action).toBe('delete')
    expect(entry!.reason).toBe('Duplicate record')
    expect(entry!.changedFields).toContain('deletedAt')
  })

  it('refuses a delete with no reason', async () => {
    const customer = makeCustomer()
    await persistCreate(db.customers, 'customer', customer, {
      userId: USER_ID,
      summary: 'created',
    })

    await expect(
      persistDelete(db.customers, 'customer', customer, {
        userId: USER_ID,
        summary: 'Customer removed',
        reason: '   ',
      }),
    ).rejects.toThrow(/reason is required/i)

    expect((await db.customers.get(customer.id))!.deletedAt).toBeFalsy()
  })
})

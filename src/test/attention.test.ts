import { describe, expect, it } from 'vitest'
import { buildAttentionQueue } from '@/domain/attention'
import type { Customer } from '@/types/customer'
import type { Inquiry } from '@/types/inquiry'
import type { SyncOutboxEntry } from '@/types/base'

const NOW = new Date('2026-07-28T12:00:00.000Z')

function inquiry(overrides: Partial<Inquiry> = {}): Inquiry {
  return {
    id: 'inq-1',
    inquiryNumber: 'INQ-00001',
    customerId: 'cus-1',
    transportMode: 'air',
    direction: 'export',
    origin: { code: 'LHR', name: 'London Heathrow', countryCode: 'GB' },
    destination: { code: 'JFK', name: 'New York JFK', countryCode: 'US' },
    cargoSummary: '4 pallets',
    requestedPickupDate: null,
    requestedDeliveryDate: null,
    specialInstructions: null,
    assignedSalesUserId: 'user-1',
    status: 'new',
    createdAt: '2026-07-28T10:00:00.000Z',
    updatedAt: '2026-07-28T10:00:00.000Z',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    version: 1,
    syncStatus: 'pending',
    deletedAt: null,
    ...overrides,
  }
}

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cus-1',
    customerCode: 'CUS-00001',
    legalName: 'Acme Aero',
    tradingName: null,
    customerType: 'shipper',
    taxIdentifier: null,
    registrationNumber: null,
    creditLimit: 1000,
    paymentTermsDays: 30,
    currency: 'USD',
    status: 'active',
    primaryContactId: null,
    billingAddress: { line1: '1 Way', city: 'London', postalCode: 'X', countryCode: 'GB' },
    shippingAddresses: [],
    complianceStatus: 'clear',
    notes: null,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    version: 1,
    syncStatus: 'synced',
    deletedAt: null,
    ...overrides,
  }
}

function outboxEntry(overrides: Partial<SyncOutboxEntry> = {}): SyncOutboxEntry {
  return {
    operationId: 'op-1',
    entityType: 'inquiry',
    entityId: 'inq-1',
    operation: 'update',
    payload: {},
    baseVersion: 1,
    createdAt: '2026-07-28T11:00:00.000Z',
    attemptCount: 1,
    lastError: 'Network error',
    status: 'failed',
    ...overrides,
  }
}

describe('attention queue', () => {
  it('is empty when nothing is at risk', () => {
    const items = buildAttentionQueue({
      inquiries: [inquiry({ status: 'converted' })],
      customers: [customer()],
      outbox: [],
      now: NOW,
    })
    expect(items).toEqual([])
  })

  it('flags failed sync operations as critical and lists them first', () => {
    const items = buildAttentionQueue({
      inquiries: [inquiry({ updatedAt: '2026-07-20T10:00:00.000Z' })],
      customers: [customer()],
      outbox: [outboxEntry()],
      now: NOW,
    })
    expect(items[0].code).toBe('SYNC_FAILED')
    expect(items[0].severity).toBe('critical')
  })

  it('flags a pickup date that has already passed', () => {
    const items = buildAttentionQueue({
      inquiries: [inquiry({ requestedPickupDate: '2026-07-25' })],
      customers: [customer()],
      outbox: [],
      now: NOW,
    })
    expect(items.map((item) => item.code)).toContain('PICKUP_DATE_PASSED')
  })

  it('flags stalled pricing after 48 hours', () => {
    const items = buildAttentionQueue({
      inquiries: [
        inquiry({ status: 'quotation_in_progress', updatedAt: '2026-07-24T10:00:00.000Z' }),
      ],
      customers: [customer()],
      outbox: [],
      now: NOW,
    })
    expect(items.map((item) => item.code)).toContain('QUOTE_STALLED')
  })

  it('flags credit holds and compliance reviews', () => {
    const items = buildAttentionQueue({
      inquiries: [],
      customers: [
        customer({ id: 'c1', status: 'credit_hold' }),
        customer({ id: 'c2', complianceStatus: 'review' }),
      ],
      outbox: [],
      now: NOW,
    })
    const codes = items.map((item) => item.code)
    expect(codes).toContain('CREDIT_HOLD')
    expect(codes).toContain('COMPLIANCE_REVIEW')
  })
})

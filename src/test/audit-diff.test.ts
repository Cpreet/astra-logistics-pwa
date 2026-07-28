import { describe, expect, it } from 'vitest'
import {
  AUDIT_IGNORED_FIELDS,
  diffEntities,
  formatAuditValue,
  formatFieldName,
} from '@/domain/audit-diff'

describe('diffEntities', () => {
  it('reports only the fields that changed', () => {
    const diff = diffEntities(
      { legalName: 'Acme Ltd', status: 'lead', paymentTermsDays: 30 },
      { legalName: 'Acme Ltd', status: 'active', paymentTermsDays: 30 },
    )

    expect(diff.changedFields).toEqual(['status'])
    expect(diff.previousValues).toEqual({ status: 'lead' })
    expect(diff.newValues).toEqual({ status: 'active' })
  })

  it('ignores bookkeeping fields that change on every write', () => {
    const diff = diffEntities(
      { status: 'lead', updatedAt: '2026-01-01T00:00:00Z', version: 1, syncStatus: 'synced' },
      { status: 'lead', updatedAt: '2026-07-01T00:00:00Z', version: 2, syncStatus: 'pending' },
    )

    expect(diff.changedFields).toEqual([])
  })

  it('exposes the ignore list so callers can reason about it', () => {
    expect(AUDIT_IGNORED_FIELDS).toContain('version')
    expect(AUDIT_IGNORED_FIELDS).toContain('updatedAt')
  })

  it('treats a create as every field being new', () => {
    const diff = diffEntities(undefined, { legalName: 'Acme Ltd', status: 'lead' })

    expect(diff.changedFields).toEqual(['legalName', 'status'])
    expect(diff.previousValues).toEqual({ legalName: null, status: null })
    expect(diff.newValues).toEqual({ legalName: 'Acme Ltd', status: 'lead' })
  })

  it('compares nested objects structurally, not by reference', () => {
    const unchanged = diffEntities(
      { billingAddress: { city: 'London', countryCode: 'GB' } },
      { billingAddress: { countryCode: 'GB', city: 'London' } },
    )
    expect(unchanged.changedFields).toEqual([])

    const changed = diffEntities(
      { billingAddress: { city: 'London', countryCode: 'GB' } },
      { billingAddress: { city: 'Manchester', countryCode: 'GB' } },
    )
    expect(changed.changedFields).toEqual(['billingAddress'])
  })

  it('compares arrays by content and order', () => {
    expect(diffEntities({ tags: ['a', 'b'] }, { tags: ['a', 'b'] }).changedFields).toEqual([])
    expect(diffEntities({ tags: ['a', 'b'] }, { tags: ['b', 'a'] }).changedFields).toEqual(['tags'])
  })

  it('treats null and undefined as the same "not set" value', () => {
    // Optional fields in this codebase use both interchangeably, so flipping
    // between them is not a real change.
    expect(diffEntities({ notes: null }, { notes: undefined }).changedFields).toEqual([])
    expect(diffEntities({ notes: undefined }, { notes: null }).changedFields).toEqual([])
    expect(diffEntities({ notes: null }, { notes: 'Hello' }).changedFields).toEqual(['notes'])
  })

  it('records a field added or removed between versions', () => {
    expect(diffEntities({}, { notes: 'Added' }).changedFields).toEqual(['notes'])
    expect(diffEntities({ notes: 'Gone' }, {}).changedFields).toEqual(['notes'])
  })

  it('normalises missing values to null so the entry is JSON-safe', () => {
    const diff = diffEntities({ notes: 'Gone' }, {})
    expect(diff.newValues).toEqual({ notes: null })
  })

  it('accepts a custom ignore list', () => {
    const diff = diffEntities({ a: 1, b: 1 }, { a: 2, b: 2 }, ['a'])
    expect(diff.changedFields).toEqual(['b'])
  })

  it('returns fields in a stable alphabetical order', () => {
    const diff = diffEntities({ zebra: 1, alpha: 1 }, { zebra: 2, alpha: 2 })
    expect(diff.changedFields).toEqual(['alpha', 'zebra'])
  })
})

describe('formatFieldName', () => {
  it('renders camelCase as words', () => {
    expect(formatFieldName('paymentTermsDays')).toBe('Payment terms days')
    expect(formatFieldName('legalName')).toBe('Legal name')
  })

  it('renders snake_case as words', () => {
    expect(formatFieldName('customer_code')).toBe('Customer code')
  })
})

describe('formatAuditValue', () => {
  it('renders empty values as a dash', () => {
    expect(formatAuditValue(null)).toBe('—')
    expect(formatAuditValue(undefined)).toBe('—')
    expect(formatAuditValue('')).toBe('—')
  })

  it('renders booleans as yes and no', () => {
    expect(formatAuditValue(true)).toBe('Yes')
    expect(formatAuditValue(false)).toBe('No')
  })

  it('summarises arrays by length', () => {
    expect(formatAuditValue([])).toBe('None')
    expect(formatAuditValue([1, 2])).toBe('2 item(s)')
  })

  it('joins object values and skips empty parts', () => {
    expect(formatAuditValue({ city: 'London', state: '', countryCode: 'GB' })).toBe('London, GB')
    expect(formatAuditValue({ city: '' })).toBe('—')
  })

  it('renders primitives as strings', () => {
    expect(formatAuditValue(30)).toBe('30')
    expect(formatAuditValue('active')).toBe('active')
  })
})

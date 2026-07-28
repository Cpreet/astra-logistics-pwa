import { describe, expect, it } from 'vitest'
import { hasPermission } from '@/domain/permissions'

describe('permissions', () => {
  it('grants sales executive customer write', () => {
    expect(hasPermission('sales_executive', 'customers.write')).toBe(true)
  })

  it('denies customer portal write access', () => {
    expect(hasPermission('customer', 'customers.write')).toBe(false)
  })

  it('grants administrator sync resolve', () => {
    expect(hasPermission('administrator', 'sync.resolve')).toBe(true)
  })
})

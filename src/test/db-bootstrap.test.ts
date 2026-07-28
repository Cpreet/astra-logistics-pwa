import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/astra-db'
import { bootstrapLocalDatabase } from '@/db/bootstrap'

describe('local persistence bootstrap', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
    await db.open()
  })

  it('initializes device metadata and marks bootstrap complete once', async () => {
    await bootstrapLocalDatabase()
    const bootstrap = await db.appSettings.get('bootstrap_complete')
    expect(bootstrap).toBeTruthy()

    await bootstrapLocalDatabase()
    const again = await db.appSettings.get('bootstrap_complete')
    expect(again?.value).toEqual(bootstrap?.value)
  })

  it('seeds demo customers and inquiries on first run', async () => {
    await bootstrapLocalDatabase()
    const customers = await db.customers.toArray()
    const inquiries = await db.inquiries.toArray()
    expect(customers.length).toBeGreaterThanOrEqual(2)
    expect(inquiries.length).toBeGreaterThanOrEqual(2)
  })
})

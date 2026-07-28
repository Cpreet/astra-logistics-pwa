import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/astra-db'
import { bootstrapLocalDatabase } from '@/db/bootstrap'
import { countPendingOutbox } from '@/repositories/sync-outbox-repository'
import { SyncEngine } from '@/sync/sync-engine'

describe('local persistence bootstrap', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
    await db.open()
  })

  it('initializes device metadata and seeds a bootstrap outbox entry once', async () => {
    await bootstrapLocalDatabase()
    const pending = await countPendingOutbox()
    expect(pending).toBe(1)

    await bootstrapLocalDatabase()
    const pendingAgain = await countPendingOutbox()
    expect(pendingAgain).toBe(1)
  })

  it('drains the outbox with the noop transport when online', async () => {
    await bootstrapLocalDatabase()
    const engine = new SyncEngine()
    const result = await engine.flush()
    expect(result.processed).toBe(1)

    const pending = await countPendingOutbox()
    expect(pending).toBe(0)
  })
})

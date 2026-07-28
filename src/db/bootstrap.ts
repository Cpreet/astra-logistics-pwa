import { db } from '@/db/astra-db'
import { runSeedIfNeeded } from '@/db/seed'
import { getOrCreateDeviceMetadata } from '@/repositories/sync-metadata-repository'
import { nowUtcIso } from '@/utils/time'

const BOOTSTRAP_KEY = 'bootstrap_complete'

export async function bootstrapLocalDatabase(): Promise<void> {
  await getOrCreateDeviceMetadata()
  await runSeedIfNeeded()

  const existing = await db.appSettings.get(BOOTSTRAP_KEY)

  if (existing) {
    return
  }

  await db.appSettings.put({
    key: BOOTSTRAP_KEY,
    value: { version: 1 },
    updatedAt: nowUtcIso(),
  })
}

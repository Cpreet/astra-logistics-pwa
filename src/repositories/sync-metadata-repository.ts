import { db } from '@/db/astra-db'
import type { SyncMetadata } from '@/types/base'
import { createId } from '@/utils/id'
import { nowUtcIso } from '@/utils/time'

const DEVICE_METADATA_ID = 'device'

export async function getOrCreateDeviceMetadata(): Promise<SyncMetadata> {
  const existing = await db.syncMetadata.get(DEVICE_METADATA_ID)
  if (existing) {
    return existing
  }

  const created: SyncMetadata = {
    id: DEVICE_METADATA_ID,
    deviceId: createId(),
    lastSyncAt: null,
    updatedAt: nowUtcIso(),
  }

  await db.syncMetadata.put(created)
  return created
}

export async function touchLastSync(): Promise<void> {
  const meta = await getOrCreateDeviceMetadata()
  await db.syncMetadata.put({
    ...meta,
    lastSyncAt: nowUtcIso(),
    updatedAt: nowUtcIso(),
  })
}

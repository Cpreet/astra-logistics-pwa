import { db } from '@/db/astra-db'
import { nowUtcIso } from '@/utils/time'

export async function readSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.appSettings.get(key)
  if (!row || row.value === undefined || row.value === null) return fallback
  return row.value as T
}

export async function writeSetting(key: string, value: unknown): Promise<void> {
  await db.appSettings.put({ key, value, updatedAt: nowUtcIso() })
}

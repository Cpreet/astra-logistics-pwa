import Dexie, { type Table } from 'dexie'
import type { SyncMetadata, SyncOutboxEntry } from '@/types/base'

export interface AppSettingRow {
  key: string
  value: unknown
  updatedAt: string
}

export class AstraDatabase extends Dexie {
  syncOutbox!: Table<SyncOutboxEntry, string>
  syncMetadata!: Table<SyncMetadata, string>
  appSettings!: Table<AppSettingRow, string>

  constructor() {
    super('astra')

    this.version(1).stores({
      syncOutbox: 'operationId, entityType, entityId, status, createdAt',
      syncMetadata: 'id',
      appSettings: 'key',
    })
  }
}

export const db = new AstraDatabase()

import Dexie, { type Table } from 'dexie'
import type { AuditLogEntry } from '@/types/audit'
import type { SyncMetadata, SyncOutboxEntry } from '@/types/base'
import type { Customer, CustomerContact } from '@/types/customer'
import type { Inquiry } from '@/types/inquiry'
import type { Notification } from '@/types/notification'
import type { User } from '@/types/user'

export interface AppSettingRow {
  key: string
  value: unknown
  updatedAt: string
}

export class AstraDatabase extends Dexie {
  syncOutbox!: Table<SyncOutboxEntry, string>
  syncMetadata!: Table<SyncMetadata, string>
  appSettings!: Table<AppSettingRow, string>
  users!: Table<User, string>
  customers!: Table<Customer, string>
  customerContacts!: Table<CustomerContact, string>
  inquiries!: Table<Inquiry, string>
  auditLogs!: Table<AuditLogEntry, string>
  notifications!: Table<Notification, string>

  constructor() {
    super('astra')

    this.version(1).stores({
      syncOutbox: 'operationId, entityType, entityId, status, createdAt',
      syncMetadata: 'id',
      appSettings: 'key',
    })

    this.version(2).stores({
      syncOutbox: 'operationId, entityType, entityId, status, createdAt',
      syncMetadata: 'id',
      appSettings: 'key',
      users: 'id, email, role, active',
      customers: 'id, customerCode, status, legalName, syncStatus, deletedAt, updatedAt',
      customerContacts: 'id, customerId, syncStatus, deletedAt',
      inquiries:
        'id, inquiryNumber, customerId, status, transportMode, assignedSalesUserId, syncStatus, deletedAt, updatedAt',
      auditLogs: 'id, entityType, entityId, createdAt',
      notifications: 'id, userId, status, createdAt, shipmentId',
    })
  }
}

export const db = new AstraDatabase()

import type { SyncOutboxEntry } from '@/types/base'

export interface SyncTransportResult {
  operationId: string
  success: boolean
  error?: string
}

export interface SyncTransport {
  push(entries: SyncOutboxEntry[]): Promise<SyncTransportResult[]>
}

/**
 * MVP transport: no backend. Marks operations as successfully "simulated"
 * so the outbox drain path can be tested without network.
 */
export class NoopSyncTransport implements SyncTransport {
  async push(entries: SyncOutboxEntry[]): Promise<SyncTransportResult[]> {
    return entries.map((entry) => ({
      operationId: entry.operationId,
      success: true,
    }))
  }
}

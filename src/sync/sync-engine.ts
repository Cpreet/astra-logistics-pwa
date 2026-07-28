import { db } from '@/db/astra-db'
import { touchLastSync } from '@/repositories/sync-metadata-repository'
import { listPendingOutbox } from '@/repositories/sync-outbox-repository'
import type { SyncTransport } from '@/sync/sync-transport'
import { NoopSyncTransport } from '@/sync/sync-transport'
import { nowUtcIso } from '@/utils/time'

export class SyncEngine {
  private processing = false
  private readonly transport: SyncTransport

  constructor(transport: SyncTransport = new NoopSyncTransport()) {
    this.transport = transport
  }

  async flush(): Promise<{ processed: number; failed: number }> {
    if (this.processing || !navigator.onLine) {
      return { processed: 0, failed: 0 }
    }

    this.processing = true
    let processed = 0
    let failed = 0

    try {
      const pending = await listPendingOutbox()
      if (pending.length === 0) {
        return { processed: 0, failed: 0 }
      }

      for (const entry of pending) {
        await db.syncOutbox.update(entry.operationId, {
          status: 'processing',
        })
      }

      const results = await this.transport.push(pending)

      for (const result of results) {
        const entry = pending.find((e) => e.operationId === result.operationId)
        if (!entry) continue

        if (result.success) {
          await db.syncOutbox.update(entry.operationId, {
            status: 'completed',
          })
          processed += 1
        } else {
          await db.syncOutbox.update(entry.operationId, {
            status: 'failed',
            attemptCount: entry.attemptCount + 1,
            lastError: result.error ?? 'Unknown sync error',
          })
          failed += 1
        }
      }

      if (processed > 0) {
        await touchLastSync()
      }
    } finally {
      this.processing = false
    }

    return { processed, failed }
  }
}

export const syncEngine = new SyncEngine()

export function startSyncEngine(): () => void {
  const run = () => {
    void syncEngine.flush()
  }

  run()
  window.addEventListener('online', run)

  const interval = window.setInterval(run, 30_000)

  return () => {
    window.removeEventListener('online', run)
    window.clearInterval(interval)
  }
}

export async function getSyncEngineStatus(): Promise<{
  pendingCount: number
  lastSyncAt: string | null
  updatedAt: string
}> {
  const pendingCount = await db.syncOutbox.where('status').equals('pending').count()
  const meta = await db.syncMetadata.get('device')
  return {
    pendingCount,
    lastSyncAt: meta?.lastSyncAt ?? null,
    updatedAt: meta?.updatedAt ?? nowUtcIso(),
  }
}

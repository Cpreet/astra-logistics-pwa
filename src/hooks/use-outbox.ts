import { useQuery } from '@tanstack/react-query'
import { db } from '@/db/astra-db'
import type { SyncOutboxEntry } from '@/types/base'

export const outboxKey = ['sync', 'outbox'] as const

export function useOutbox() {
  return useQuery<SyncOutboxEntry[]>({
    queryKey: outboxKey,
    queryFn: async () => {
      const rows = await db.syncOutbox.toArray()
      return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    refetchInterval: 15_000,
  })
}

export function useAuditTrail(entityId: string | undefined) {
  return useQuery({
    queryKey: ['audit', entityId],
    queryFn: async () => {
      const rows = await db.auditLogs.where('entityId').equals(entityId!).toArray()
      return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    enabled: Boolean(entityId),
  })
}

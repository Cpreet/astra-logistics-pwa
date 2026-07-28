import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNowStrict } from 'date-fns'
import { CloudUpload, RefreshCw, WifiOff } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle, SectionHeading } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { outboxKey, useOutbox } from '@/hooks/use-outbox'
import { syncEngine } from '@/sync/sync-engine'
import type { SyncOutboxEntry } from '@/types/base'

const statusTone: Record<SyncOutboxEntry['status'], 'warning' | 'info' | 'success' | 'danger'> = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'danger',
  conflict: 'danger',
  cancelled: 'warning',
}

export function SyncPage() {
  const online = useOnlineStatus()
  const { data: entries = [], isLoading } = useOutbox()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const pending = entries.filter((entry) => entry.status === 'pending')
  const failed = entries.filter((entry) => entry.status === 'failed')

  const flush = useMutation({
    mutationFn: () => syncEngine.flush(),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: outboxKey })
      notify({
        tone: result.failed > 0 ? 'error' : 'success',
        message: `${result.processed} operation${result.processed === 1 ? '' : 's'} pushed`,
        description: result.failed > 0 ? `${result.failed} failed` : 'Simulated transport (no backend yet)',
      })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sync activity"
        description="Every change is written locally first, then queued for the server."
        actions={
          <Button
            variant="secondary"
            loading={flush.isPending}
            disabled={!online || pending.length === 0}
            onClick={() => flush.mutate()}
          >
            <RefreshCw className="size-4" aria-hidden />
            Sync now
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          {online ? (
            <CloudUpload className="mb-2 size-5 text-success" aria-hidden />
          ) : (
            <WifiOff className="mb-2 size-5 text-warning" aria-hidden />
          )}
          <p className="text-sm font-semibold text-ink">{online ? 'Online' : 'Offline'}</p>
          <CardDescription className="text-xs">
            {online ? 'Queue drains automatically' : 'Changes wait safely on this device'}
          </CardDescription>
        </Card>
        <Card className="p-4">
          <p className="tabular text-2xl font-semibold text-ink">{pending.length}</p>
          <CardDescription className="text-xs">Queued operations</CardDescription>
        </Card>
        <Card className="p-4">
          <p className="tabular text-2xl font-semibold text-ink">{failed.length}</p>
          <CardDescription className="text-xs">Failed operations</CardDescription>
        </Card>
      </div>

      <Card className="border-info/40 bg-info-soft">
        <CardTitle className="text-sm text-info">Simulated transport</CardTitle>
        <CardDescription className="mt-1 text-info">
          There is no backend in this MVP. Pushing marks operations complete locally so the queue
          behaviour can be verified end to end.
        </CardDescription>
      </Card>

      <section aria-label="Operation queue">
        <SectionHeading className="mb-2">Operations</SectionHeading>
        {isLoading ? (
          <p className="text-sm text-muted">Loading queue…</p>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={CloudUpload}
            title="Nothing queued"
            description="Create or edit a record and it will appear here until it syncs."
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {entries.slice(0, 40).map((entry) => (
              <li key={entry.operationId} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium capitalize text-ink">
                    {entry.operation} {entry.entityType.replaceAll('_', ' ')}
                  </span>
                  <span className="block truncate text-xs text-faint">
                    {formatDistanceToNowStrict(new Date(entry.createdAt))} ago · v
                    {entry.baseVersion}
                    {entry.lastError ? ` · ${entry.lastError}` : ''}
                  </span>
                </span>
                <Badge tone={statusTone[entry.status]}>{entry.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

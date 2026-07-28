import { useQuery } from '@tanstack/react-query'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { ArrowRight, ChevronRight, History } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { SectionHeading } from '@/components/ui/card'
import { ListSkeleton } from '@/components/ui/skeleton'
import { formatAuditValue, formatFieldName } from '@/domain/audit-diff'
import { auditKeys } from '@/features/audit/audit-keys'
import { listAuditTrailForEntity } from '@/repositories/audit-repository'
import { listActiveUsers } from '@/repositories/user-repository'
import type { AuditLogEntry } from '@/types/audit'

const ACTION_TONE: Record<AuditLogEntry['action'], BadgeTone> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  transition: 'brand',
}

const ACTION_LABEL: Record<AuditLogEntry['action'], string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  transition: 'Transition',
}

/**
 * Fields that say nothing useful in a changelog. Identity and creation
 * bookkeeping is already implied by the "Created" entry itself.
 */
const NOISY_ON_CREATE = new Set(['id', 'createdAt', 'createdBy', 'deletedAt'])

function ChangeList({ entry }: { entry: AuditLogEntry }) {
  const fields = (entry.changedFields ?? []).filter(
    (field) => entry.action !== 'create' || !NOISY_ON_CREATE.has(field),
  )

  if (fields.length === 0) return null

  const list = (
    <ul className="mt-1.5 space-y-1">
      {fields.map((field) => (
        <li key={field} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
          <span className="font-medium text-muted">{formatFieldName(field)}</span>
          {entry.action === 'create' ? (
            <span className="text-ink">{formatAuditValue(entry.newValues?.[field])}</span>
          ) : (
            <>
              <span className="text-faint line-through">
                {formatAuditValue(entry.previousValues?.[field])}
              </span>
              <ArrowRight className="size-3 shrink-0 text-faint" aria-hidden />
              <span className="text-ink">{formatAuditValue(entry.newValues?.[field])}</span>
            </>
          )}
        </li>
      ))}
    </ul>
  )

  // A create sets every field, so listing them inline buries the rest of the
  // trail under twenty lines of noise. Updates list their changes directly —
  // that is the part someone opened this view to read.
  if (entry.action !== 'create') return list

  return (
    <details className="group/details mt-1">
      <summary className="inline-flex cursor-pointer items-center gap-1 rounded text-xs text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        <ChevronRight
          className="size-3 transition-transform group-open/details:rotate-90"
          aria-hidden
        />
        {fields.length} initial {fields.length === 1 ? 'value' : 'values'}
      </summary>
      {list}
    </details>
  )
}

/**
 * Append-only history for one record.
 *
 * The brief (§6.18) requires this view on customers, quotations, shipments,
 * documents, compliance checks, invoices, payments and incidents — so it takes
 * only an entity id and serves all of them.
 */
export function AuditTrail({
  entityId,
  title = 'Audit history',
  emptyMessage = 'No recorded changes yet.',
}: {
  entityId: string
  title?: string
  emptyMessage?: string
}) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: auditKeys.entity(entityId),
    queryFn: () => listAuditTrailForEntity(entityId),
  })
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: listActiveUsers })

  const actorName = (userId: string) =>
    users.find((user) => user.id === userId)?.name ?? 'System'

  if (isLoading) {
    return (
      <section aria-label={title}>
        <SectionHeading className="mb-2">{title}</SectionHeading>
        <ListSkeleton rows={2} />
      </section>
    )
  }

  return (
    <section aria-label={title}>
      <SectionHeading className="mb-2">{title}</SectionHeading>
      {entries.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-card border border-line bg-surface px-3 py-3">
          <History className="size-4 shrink-0 text-faint" aria-hidden />
          <p className="text-sm text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <ol className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {entries.map((entry) => (
            <li key={entry.id} className="px-3 py-2.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Badge tone={ACTION_TONE[entry.action]}>{ACTION_LABEL[entry.action]}</Badge>
                <span className="min-w-0 flex-1 text-sm text-ink">{entry.summary}</span>
                <time
                  dateTime={entry.createdAt}
                  title={format(new Date(entry.createdAt), 'PPpp')}
                  className="tabular shrink-0 text-xs text-faint"
                >
                  {formatDistanceToNowStrict(new Date(entry.createdAt))} ago
                </time>
              </div>

              <p className="mt-0.5 text-xs text-muted">by {actorName(entry.userId)}</p>

              {entry.reason ? (
                <p className="mt-1 text-xs text-muted">
                  <span className="font-medium">Reason:</span> {entry.reason}
                </p>
              ) : null}

              <ChangeList entry={entry} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

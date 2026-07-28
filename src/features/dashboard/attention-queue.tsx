import { CheckCircle2, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/ui/card'
import type { AttentionItem, AttentionSeverity } from '@/domain/attention'
import { cn } from '@/utils/cn'

const severityTone: Record<AttentionSeverity, 'danger' | 'warning' | 'info'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
}

const severityBar: Record<AttentionSeverity, string> = {
  critical: 'bg-danger',
  high: 'bg-warning',
  medium: 'bg-info',
}

const severityLabel: Record<AttentionSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Watch',
}

export function AttentionQueue({ items }: { items: AttentionItem[] }) {
  return (
    <section aria-label="Needs attention">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <SectionHeading>Needs attention</SectionHeading>
        {items.length > 0 ? (
          <span className="tabular text-xs text-muted">{items.length} open</span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
          <div>
            <p className="text-sm font-medium text-ink">Nothing needs attention</p>
            <p className="text-xs text-muted">
              No stalled lanes, credit holds, or failed syncs right now.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 6).map((item) => (
            <li key={item.id}>
              <Link
                to={item.to}
                className="group flex items-stretch gap-3 overflow-hidden rounded-card border border-line bg-surface shadow-card transition-colors hover:border-line-strong"
              >
                <span className={cn('w-1 shrink-0', severityBar[item.severity])} aria-hidden />
                <span className="min-w-0 flex-1 py-3 pr-3">
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge tone={severityTone[item.severity]}>{severityLabel[item.severity]}</Badge>
                    <span className="truncate text-sm font-medium text-ink">{item.title}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">
                    {item.detail}
                  </span>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand">
                    {item.actionLabel}
                    <ChevronRight
                      className="size-3 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

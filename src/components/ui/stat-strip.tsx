import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export interface Stat {
  id: string
  label: string
  value: ReactNode
  /** Optional qualifier shown under the value — a delta, a basis, a unit. */
  hint?: string
  to?: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

const TONE: Record<NonNullable<Stat['tone']>, string> = {
  default: 'text-ink',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

/**
 * Compact KPI row. One bordered strip rather than a grid of cards, so the
 * numbers stay above the fold and read as a single instrument panel.
 */
export function StatStrip({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <dl
      className={cn(
        'grid grid-cols-2 overflow-hidden rounded-card border border-line bg-surface sm:grid-cols-4',
        className,
      )}
    >
      {stats.map((stat, index) => {
        const body = (
          <>
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-faint">
              {stat.label}
            </dt>
            <dd
              className={cn(
                'tabular mt-0.5 text-xl font-semibold tracking-tight',
                TONE[stat.tone ?? 'default'],
              )}
            >
              {stat.value}
            </dd>
            {stat.hint ? <dd className="mt-0.5 text-xs text-muted">{stat.hint}</dd> : null}
          </>
        )

        // Two columns on mobile, four on desktop — so the dividing lines differ
        // per breakpoint. Computed per cell rather than with `divide-*`, which
        // draws in DOM order and would put a line at the start of each row.
        const cellClass = cn(
          'px-4 py-3',
          index % 2 === 1 && 'border-l border-line',
          index % 4 === 0 ? 'sm:border-l-0' : 'sm:border-l sm:border-line',
          index >= 2 && 'border-t border-line sm:border-t-0',
        )

        return stat.to ? (
          <Link
            key={stat.id}
            to={stat.to}
            className={cn(cellClass, 'transition-colors hover:bg-raised')}
          >
            {body}
          </Link>
        ) : (
          <div key={stat.id} className={cellClass}>
            {body}
          </div>
        )
      })}
    </dl>
  )
}

import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * List-page control bar: search and filters on one line so the table starts
 * higher up the page. Wraps to two lines on narrow screens.
 */
export function Toolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  searchLabel = 'Search',
  filters,
  trailing,
  className,
}: {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  searchLabel?: string
  filters?: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex flex-wrap items-center gap-2', className)}>
      <div className="relative min-w-56 flex-1">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint"
          aria-hidden
        />
        <input
          type="search"
          aria-label={searchLabel}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="min-h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-faint transition-colors hover:border-line-strong focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
      </div>
      {filters ? <div className="flex shrink-0 items-center gap-2">{filters}</div> : null}
      {trailing ? <div className="ml-auto flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </div>
  )
}

/** Row count / result summary shown beside a table. */
export function ResultCount({ shown, total, noun }: { shown: number; total: number; noun: string }) {
  return (
    <p className="tabular text-xs text-muted">
      {shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`}
    </p>
  )
}

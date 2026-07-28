import { cn } from '@/utils/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  count?: number
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (next: T) => void
  label: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="scrollbar-none flex gap-1 overflow-x-auto rounded-lg border border-line bg-raised p-1"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
              active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
            {typeof option.count === 'number' ? (
              <span className={cn('tabular text-xs', active ? 'text-brand' : 'text-faint')}>
                {option.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

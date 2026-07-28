import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Empty states double as onboarding: explain what belongs here, why it matters,
 * then give one primary action and an optional shortcut.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  value,
  action,
  secondaryAction,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  value?: string
  action?: ReactNode
  secondaryAction?: ReactNode
}) {
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      {Icon ? (
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-soft">
          <Icon className="size-6 text-brand" aria-hidden />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {value ? <p className="mx-auto mt-1 max-w-sm text-xs text-faint">{value}</p> : null}
      {action || secondaryAction ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}

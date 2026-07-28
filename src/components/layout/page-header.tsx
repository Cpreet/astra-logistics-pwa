import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function PageHeader({
  title,
  description,
  actions,
  backTo,
  backLabel = 'Back',
  eyebrow,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  backTo?: string
  backLabel?: string
  eyebrow?: string
  className?: string
}) {
  return (
    <div className={cn('mb-5 sm:mb-6', className)}>
      {backTo ? (
        <Link
          to={backTo}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-faint">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="truncate text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-raised text-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  brand: 'bg-brand-soft text-brand',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}

export function Dot({ tone = 'neutral' }: { tone?: BadgeTone }) {
  const color: Record<BadgeTone, string> = {
    neutral: 'bg-faint',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    brand: 'bg-brand',
  }
  return <span className={cn('size-1.5 shrink-0 rounded-full', color[tone])} aria-hidden />
}

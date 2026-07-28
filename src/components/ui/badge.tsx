import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

const variants = {
  default: 'bg-slate-800 text-slate-200',
  success: 'bg-emerald-950 text-emerald-300 ring-1 ring-emerald-800',
  warning: 'bg-amber-950 text-amber-200 ring-1 ring-amber-800',
  danger: 'bg-red-950 text-red-200 ring-1 ring-red-900',
  info: 'bg-sky-950 text-sky-200 ring-1 ring-sky-800',
} as const

export function Badge({
  variant = 'default',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

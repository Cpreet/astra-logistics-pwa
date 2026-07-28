import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

const controlBase =
  'w-full rounded-lg border border-line bg-surface px-3 text-base text-ink transition-colors placeholder:text-faint hover:border-line-strong focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-60 sm:text-sm'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlBase, 'min-h-11 py-2', className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlBase, 'min-h-11 py-2 pr-8', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlBase, 'min-h-24 py-2', className)} {...props} />
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  optional?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
          {label}
        </label>
        {optional ? <span className="text-xs text-faint">Optional</span> : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  )
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

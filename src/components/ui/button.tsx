import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-sky-600 text-white hover:bg-sky-500 focus-visible:ring-sky-400 disabled:bg-slate-600',
  secondary:
    'bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-700 focus-visible:ring-slate-400',
  ghost: 'text-slate-200 hover:bg-slate-800 focus-visible:ring-slate-500',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}

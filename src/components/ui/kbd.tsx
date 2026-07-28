import { cn } from '@/utils/cn'

export function Kbd({ children, className }: { children: string; className?: string }) {
  return (
    <kbd
      className={cn(
        'rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-[0.68rem] font-medium text-muted',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

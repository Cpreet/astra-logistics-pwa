import type { ReactNode } from 'react'

/** Sticky on mobile so the primary action is always reachable with a thumb. */
export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-16 z-20 -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-card md:border md:px-4">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>
    </div>
  )
}

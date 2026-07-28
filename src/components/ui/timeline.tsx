import { cn } from '@/utils/cn'

export type TimelineState = 'done' | 'current' | 'upcoming' | 'exception'

export interface TimelineStep {
  key: string
  label: string
  caption?: string
  state: TimelineState
}

const markerClasses: Record<TimelineState, string> = {
  done: 'bg-success text-white',
  current: 'bg-brand text-on-brand ring-4 ring-brand/20',
  upcoming: 'bg-raised text-faint',
  exception: 'bg-danger text-white',
}

/**
 * Colour-coded lane timeline: deviations must be visible without a click.
 */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold',
                  markerClasses[step.state],
                )}
              >
                {index + 1}
              </span>
              {!last ? (
                <span
                  className={cn(
                    'w-px flex-1 py-1',
                    step.state === 'done' ? 'bg-success/40' : 'bg-line',
                  )}
                />
              ) : null}
            </div>
            <div className={cn('min-w-0', last ? 'pb-0' : 'pb-5')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  step.state === 'upcoming' ? 'text-faint' : 'text-ink',
                )}
              >
                {step.label}
              </p>
              {step.caption ? <p className="text-xs text-muted">{step.caption}</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

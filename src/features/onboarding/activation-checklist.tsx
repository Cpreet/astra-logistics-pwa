import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Progress } from '@/components/ui/progress'
import { SectionHeading } from '@/components/ui/card'
import { useActivation } from '@/hooks/use-activation'
import { ACTIVATION_STEPS, activationProgress, type ActivationStep } from '@/services/activation-service'
import { cn } from '@/utils/cn'

const STEP_COPY: Record<ActivationStep, { label: string; hint: string; to?: string }> = {
  created_customer: {
    label: 'Add a customer',
    hint: 'Two fields is enough to start',
    to: '/customers/new',
  },
  created_inquiry: {
    label: 'Capture an inquiry',
    hint: 'Pick a lane template to skip typing',
    to: '/inquiries/new',
  },
  advanced_inquiry: {
    label: 'Move it through the workflow',
    hint: 'Qualify, then mark it quoted',
    to: '/inquiries',
  },
  worked_offline: {
    label: 'Save something offline',
    hint: 'Turn off your network, then save',
  },
}

export function ActivationChecklist() {
  const { steps, dismissed, loading, dismiss } = useActivation()
  const progress = activationProgress(steps)

  if (loading || dismissed || progress.done) return null

  return (
    <section
      aria-label="Getting started"
      className="rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionHeading>Get productive</SectionHeading>
          <p className="mt-1 text-sm text-muted">
            {progress.completed} of {progress.total} done — about two minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dismiss()}
          className="rounded-md p-1 text-faint hover:bg-raised hover:text-ink"
          aria-label="Dismiss getting started"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3">
        <Progress value={progress.completed} max={progress.total} label="Activation progress" />
      </div>

      <ul className="mt-4 space-y-1">
        {ACTIVATION_STEPS.map((step) => {
          const done = Boolean(steps[step])
          const copy = STEP_COPY[step]
          const content = (
            <>
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border',
                  done ? 'border-success bg-success text-white' : 'border-line-strong text-faint',
                )}
                aria-hidden
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-sm font-medium',
                    done ? 'text-faint line-through' : 'text-ink',
                  )}
                >
                  {copy.label}
                </span>
                {!done ? <span className="block text-xs text-muted">{copy.hint}</span> : null}
              </span>
            </>
          )

          return (
            <li key={step}>
              {copy.to && !done ? (
                <Link
                  to={copy.to}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-raised"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-2 py-2">{content}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

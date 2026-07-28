import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionHeading } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Permission } from '@/domain/permissions'
import { useAuth } from '@/features/auth/auth-context'
import { useActivation } from '@/hooks/use-activation'
import { ACTIVATION_STEPS, type ActivationStep } from '@/services/activation-service'
import { cn } from '@/utils/cn'

const STEP_COPY: Record<
  ActivationStep,
  { label: string; hint: string; to?: string; requires?: Permission }
> = {
  created_customer: {
    label: 'Add a customer',
    hint: 'Four fields is enough to start',
    to: '/customers/new',
    requires: 'customers.write',
  },
  created_inquiry: {
    label: 'Capture an inquiry',
    hint: 'Pick a lane template to skip typing',
    to: '/inquiries/new',
    requires: 'inquiries.write',
  },
  advanced_inquiry: {
    label: 'Move it through the workflow',
    hint: 'Qualify the lane, then mark it quoted',
    to: '/inquiries',
    requires: 'inquiries.write',
  },
  worked_offline: {
    label: 'Save something offline',
    hint: 'Turn off your network, then save',
  },
}

export function ActivationChecklist() {
  const { steps, dismissed, loading, dismiss } = useActivation()
  const { can } = useAuth()

  // Only suggest work this role can actually perform.
  const visibleSteps = ACTIVATION_STEPS.filter((step) => {
    const requires = STEP_COPY[step].requires
    return !requires || can(requires)
  })

  const actionable = visibleSteps.filter((step) => STEP_COPY[step].requires)
  const completed = visibleSteps.filter((step) => Boolean(steps[step])).length

  if (loading || dismissed || actionable.length === 0 || completed === visibleSteps.length) {
    return null
  }

  return (
    <section
      aria-label="Getting started"
      className="rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionHeading>Get productive</SectionHeading>
          <p className="mt-1 text-sm text-muted">
            {completed} of {visibleSteps.length} done — about two minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dismiss()}
          className="rounded-md p-1 text-faint transition-colors hover:bg-raised hover:text-ink"
          aria-label="Dismiss getting started"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3">
        <Progress value={completed} max={visibleSteps.length} label="Activation progress" />
      </div>

      <ul className="mt-4 space-y-1">
        {visibleSteps.map((step) => {
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

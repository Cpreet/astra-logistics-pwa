import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { buttonClasses } from '@/components/ui/button'

/**
 * Local-only diagnostic log. Never sent anywhere and never records payload
 * bodies — `security-notes.md` §2 forbids logging document contents.
 */
function logLocally(error: unknown, context: string) {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  // eslint-disable-next-line no-console
  console.error(`[astra] ${context} — ${detail}`)
}

function Fallback({
  title,
  detail,
  onRetry,
}: {
  title: string
  detail: string
  onRetry?: () => void
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div
        role="alert"
        className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-card"
      >
        <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-danger-soft">
          <AlertTriangle className="size-5 text-danger" aria-hidden />
        </span>
        <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{detail}</p>
        <p className="mt-3 rounded-lg bg-raised px-3 py-2 text-xs text-muted">
          Your local data is untouched. Anything already saved on this device — including work
          queued for sync — is still there.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {onRetry ? (
            <button type="button" onClick={onRetry} className={buttonClasses('primary', 'md')}>
              <RotateCcw className="size-4" aria-hidden />
              Try again
            </button>
          ) : null}
          <Link to="/" className={buttonClasses('secondary', 'md')}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Route-level handler: catches render and loader failures under a route. */
export function RouteErrorBoundary() {
  const error = useRouteError()
  logLocally(error, 'route error')

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <Fallback
        title="Page not found"
        detail="That address does not match anything in this workspace."
      />
    )
  }

  return (
    <Fallback
      title="This screen failed to load"
      detail="Something went wrong while rendering. Retrying usually clears it; if it keeps happening, note what you were doing and report it."
      onRetry={() => window.location.reload()}
    />
  )
}

/**
 * App-level handler. Wraps the whole tree so a failure outside the router —
 * a provider, the theme, the database bootstrap — still shows a usable screen
 * instead of a blank page.
 */
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logLocally(error, `render error${info.componentStack ? ' in component tree' : ''}`)
  }

  render() {
    if (this.state.error) {
      return (
        <Fallback
          title="ASTRA could not start"
          detail="The application hit an unexpected error before it finished loading."
          onRetry={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}

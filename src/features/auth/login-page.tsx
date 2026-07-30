import { useQuery } from '@tanstack/react-query'
import { ArrowRight, KeyRound, Plane, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { DEMO_LOGIN_PASSWORD } from '@/domain/demo-auth'
import { formatRoleLabel } from '@/domain/permissions'
import { useAuth } from '@/features/auth/auth-context'
import { listActiveUsers } from '@/repositories/user-repository'
import type { User } from '@/types/user'
import { cn } from '@/utils/cn'

export function LoginPage() {
  const { user, loading, signInWithCredentials } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { notify } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: listActiveUsers,
  })

  const from =
    (location.state as { from?: string } | null)?.from && (location.state as { from?: string }).from !== '/login'
      ? (location.state as { from?: string }).from
      : '/'

  useEffect(() => {
    if (!loading && user) navigate(from ?? '/', { replace: true })
  }, [loading, user, navigate, from])

  const submit = async (nextEmail: string, nextPassword: string) => {
    setSubmitting(true)
    try {
      await signInWithCredentials(nextEmail, nextPassword)
      navigate(from ?? '/', { replace: true })
    } catch (error) {
      notify({
        tone: 'error',
        message: 'Could not sign in',
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const quickSignIn = async (account: User) => {
    setEmail(account.email)
    setPassword(DEMO_LOGIN_PASSWORD)
    await submit(account.email, DEMO_LOGIN_PASSWORD)
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-10 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-14 lg:py-16">
        <header>
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1">
            <Plane className="size-3.5 text-brand" aria-hidden />
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
              ASTRA
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            Sign in to your workspace
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            Use a seeded demo account below. Each user has a different role so you can see how
            permissions change the app.
          </p>
          <p className="mt-6 flex items-start gap-2 text-xs text-faint">
            <WifiOff className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Demo authentication only — sessions stay in this browser. Not for production use.
          </p>
          <p className="mt-3 text-sm text-muted">
            Prefer a one-tap role picker?{' '}
            <Link to="/welcome" className="font-medium text-brand hover:underline">
              Continue on the welcome screen
            </Link>
          </p>
        </header>

        <div className="space-y-4">
          <Card>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4 text-brand" aria-hidden />
              Email sign-in
            </CardTitle>
            <CardDescription className="mt-1">
              Password for every demo user:{' '}
              <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-xs text-ink">
                {DEMO_LOGIN_PASSWORD}
              </code>
            </CardDescription>

            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                void submit(email, password)
              }}
            >
              <Field label="Email" htmlFor="login-email">
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="sales@astra.demo"
                  required
                />
              </Field>
              <Field label="Password" htmlFor="login-password">
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={DEMO_LOGIN_PASSWORD}
                  required
                />
              </Field>
              <Button type="submit" className="w-full" loading={submitting}>
                Sign in
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </form>
          </Card>

          <section aria-labelledby="demo-users-heading">
            <h2 id="demo-users-heading" className="text-sm font-semibold text-ink">
              Dummy accounts
            </h2>
            <p className="mt-1 text-xs text-muted">
              Tap an account to sign in instantly with the demo password.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {users.map((account) => (
                <li key={account.id}>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void quickSignIn(account)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-brand hover:shadow-card disabled:opacity-60',
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xs font-semibold text-brand">
                      {account.name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {account.name}
                      </span>
                      <span className="block truncate text-xs text-muted">{account.email}</span>
                    </span>
                    <Badge tone="brand" className="shrink-0 max-w-[7rem] truncate">
                      {formatRoleLabel(account.role)}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
            {users.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                No demo users found. Reload demo data from the account menu after signing in, or
                refresh once bootstrap completes.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}

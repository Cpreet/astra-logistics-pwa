import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Gauge,
  Plane,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  WifiOff,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { listActiveUsers } from '@/repositories/user-repository'
import type { User, UserRole } from '@/types/user'
import { cn } from '@/utils/cn'

const ROLE_CARDS: Array<{
  role: UserRole
  title: string
  outcome: string
  icon: typeof Plane
  primary: boolean
}> = [
  {
    role: 'sales_executive',
    title: 'Sales',
    outcome: 'Capture inquiries and win lanes',
    icon: Users,
    primary: true,
  },
  {
    role: 'operations_executive',
    title: 'Operations',
    outcome: 'Book carriers and move shipments',
    icon: Plane,
    primary: true,
  },
  {
    role: 'pricing_executive',
    title: 'Pricing',
    outcome: 'Rate lanes and protect margin',
    icon: Gauge,
    primary: true,
  },
  {
    role: 'manager',
    title: 'Manager',
    outcome: 'Track SLA risk and approvals',
    icon: BadgeCheck,
    primary: true,
  },
  {
    role: 'documentation_executive',
    title: 'Documentation',
    outcome: 'Collect and verify paperwork',
    icon: FileText,
    primary: true,
  },
  {
    role: 'finance_executive',
    title: 'Finance',
    outcome: 'Invoice, collect, and reconcile',
    icon: Banknote,
    primary: true,
  },
  {
    role: 'compliance_officer',
    title: 'Compliance',
    outcome: 'Screen cargo and release holds',
    icon: ShieldCheck,
    primary: false,
  },
  {
    role: 'warehouse_executive',
    title: 'Warehouse',
    outcome: 'Receive and inspect cargo',
    icon: Warehouse,
    primary: false,
  },
  {
    role: 'administrator',
    title: 'Administrator',
    outcome: 'Full access and sync control',
    icon: ClipboardCheck,
    primary: false,
  },
  {
    role: 'customer',
    title: 'Customer portal',
    outcome: 'Read-only shipment visibility',
    icon: Truck,
    primary: false,
  },
]

export function WelcomePage() {
  const { user, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null)

  const { data: users = [] } = useQuery({ queryKey: ['users', 'active'], queryFn: listActiveUsers })

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true })
  }, [loading, user, navigate])

  const start = async (role: UserRole) => {
    const match: User | undefined = users.find((candidate) => candidate.role === role)
    if (!match) return
    setPendingRole(role)
    await signIn(match)
    navigate('/', { replace: true })
  }

  const visible = ROLE_CARDS.filter((card) => showAll || card.primary)

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16 lg:py-20">
        <header>
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1">
            <Plane className="size-3.5 text-brand" aria-hidden />
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
              ASTRA
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            Freight intelligence that keeps working when the network doesn’t.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            Run air freight from inquiry to cash. Pick your role and you’ll land straight in a
            working workspace — no setup, no forms, no waiting.
          </p>
          <dl className="mt-8 grid max-w-md gap-3 sm:grid-cols-3">
            {[
              { term: 'Setup time', detail: 'One tap' },
              { term: 'Works offline', detail: 'Full read + write' },
              { term: 'Sample data', detail: 'Ready to explore' },
            ].map((item) => (
              <div key={item.term} className="rounded-lg border border-line bg-surface px-3 py-2">
                <dt className="text-[0.68rem] uppercase tracking-wide text-faint">{item.term}</dt>
                <dd className="text-sm font-medium text-ink">{item.detail}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 flex items-start gap-2 text-xs text-faint">
            <WifiOff className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Demo authentication only — no passwords on this screen, or use{' '}
            <Link to="/login" className="font-medium text-brand hover:underline">
              email sign-in
            </Link>
            .
          </p>
        </header>

        <div>
          <h2 className="text-sm font-semibold text-ink">What do you do?</h2>
          <p className="mt-1 text-sm text-muted">
            This tailors your home screen and permissions. You can switch any time.
          </p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {visible.map((card) => (
              <li key={card.role}>
                <button
                  type="button"
                  onClick={() => void start(card.role)}
                  disabled={pendingRole !== null}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-all hover:border-brand hover:shadow-card disabled:opacity-60',
                    pendingRole === card.role && 'border-brand ring-2 ring-brand/25',
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
                    <card.icon className="size-4 text-brand" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{card.title}</span>
                    <span className="block truncate text-xs text-muted">{card.outcome}</span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>

          {!showAll ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setShowAll(true)}
            >
              <ChevronDown className="size-4" aria-hidden />
              Show all 10 roles
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

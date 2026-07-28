import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNowStrict } from 'date-fns'
import { ArrowRight, Plus } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { buttonClasses } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/card'
import { StatStrip, type Stat } from '@/components/ui/stat-strip'
import { InquiryStatusBadge } from '@/components/ui/status-badge'
import { ListSkeleton } from '@/components/ui/skeleton'
import { buildAttentionQueue } from '@/domain/attention'
import { formatRoleLabel } from '@/domain/permissions'
import { getRoleHome } from '@/domain/role-home'
import { AttentionQueue } from '@/features/dashboard/attention-queue'
import { ActivationChecklist } from '@/features/onboarding/activation-checklist'
import { useAuth } from '@/features/auth/auth-context'
import { useActivation } from '@/hooks/use-activation'
import { useCustomers } from '@/hooks/use-customers'
import { useInquiries } from '@/hooks/use-inquiries'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useOutbox } from '@/hooks/use-outbox'
import { listAuditTrail } from '@/repositories/audit-repository'
import { cn } from '@/utils/cn'

const OPEN_STATUSES = new Set(['new', 'qualified', 'quotation_in_progress', 'quoted'])

export function DashboardPage() {
  const { user } = useAuth()
  const online = useOnlineStatus()
  const { markStep } = useActivation()
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers()
  const { data: inquiries = [], isLoading: loadingInquiries } = useInquiries()
  const { data: outbox = [] } = useOutbox()
  const { data: activity = [] } = useQuery({
    queryKey: ['audit', 'recent'],
    queryFn: () => listAuditTrail(6),
  })

  const roleHome = user ? getRoleHome(user.role) : null

  const attention = useMemo(
    () => buildAttentionQueue({ inquiries, customers, outbox }),
    [inquiries, customers, outbox],
  )

  const pendingSync = outbox.filter((entry) => entry.status === 'pending').length

  useEffect(() => {
    if (!online && pendingSync > 0) {
      void markStep('worked_offline')
    }
  }, [online, pendingSync, markStep])

  const stats = useMemo<Stat[]>(() => {
    const open = inquiries.filter((inquiry) => OPEN_STATUSES.has(inquiry.status))
    const quoted = inquiries.filter((inquiry) => inquiry.status === 'quoted')
    const blocking = attention.filter((item) => item.severity !== 'medium').length
    return [
      {
        id: 'attention',
        label: 'Needs attention',
        value: blocking,
        hint: blocking === 0 ? 'All clear' : 'Blocking or at risk',
        tone: blocking > 0 ? 'warning' : 'success',
      },
      { id: 'open', label: 'Open lanes', value: open.length, to: '/inquiries?status=open' },
      {
        id: 'quoted',
        label: 'Awaiting decision',
        value: quoted.length,
        to: '/inquiries?status=quoted',
      },
      {
        id: 'pending',
        label: 'Pending sync',
        value: pendingSync,
        hint: pendingSync === 0 ? 'Everything queued is clear' : 'Saved locally, not yet pushed',
        to: '/sync',
        tone: pendingSync > 0 ? 'warning' : 'default',
      },
    ]
  }, [inquiries, attention, pendingSync])

  const pipeline = useMemo(
    () => [
      {
        label: 'Won',
        value: inquiries.filter((inquiry) => inquiry.status === 'converted').length,
        to: '/inquiries?status=converted',
      },
      { label: 'Customers', value: customers.length, to: '/customers' },
    ],
    [inquiries, customers],
  )

  const recentInquiries = inquiries.slice(0, 4)
  const loading = loadingCustomers || loadingInquiries

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={user ? formatRoleLabel(user.role) : undefined}
        title={roleHome?.headline ?? 'Operations overview'}
        description={roleHome?.focus}
        actions={
          roleHome?.primaryAction ? (
            <Link to={roleHome.primaryAction.to} className={buttonClasses('primary', 'md')}>
              <Plus className="size-4" aria-hidden />
              {roleHome.primaryAction.label}
            </Link>
          ) : null
        }
      />

      <StatStrip stats={stats} />

      {loading ? <ListSkeleton rows={3} /> : <AttentionQueue items={attention} />}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-label="Recent inquiries">
          <div className="mb-2 flex items-baseline justify-between">
            <SectionHeading>Recent inquiries</SectionHeading>
            <Link
              to="/inquiries"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              View all
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
          {recentInquiries.length === 0 ? (
            <p className="rounded-card border border-dashed border-line-strong bg-surface p-4 text-sm text-muted">
              No inquiries yet.{' '}
              <Link to="/inquiries/new" className="font-medium text-brand hover:underline">
                Capture your first lane
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {recentInquiries.map((inquiry) => (
                <li key={inquiry.id}>
                  <Link
                    to={`/inquiries/${inquiry.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-raised"
                  >
                    <span className="tabular w-28 shrink-0 text-sm font-medium text-ink">
                      {inquiry.inquiryNumber}
                    </span>
                    <span className="tabular hidden w-28 shrink-0 whitespace-nowrap text-sm text-muted sm:block">
                      {inquiry.origin.code} <span className="text-faint">→</span>{' '}
                      {inquiry.destination.code}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-muted">
                      Updated {formatDistanceToNowStrict(new Date(inquiry.updatedAt))} ago
                    </span>
                    <InquiryStatusBadge status={inquiry.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            {pipeline.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-baseline gap-2 rounded-card border border-line bg-surface px-3 py-2 transition-colors hover:bg-raised"
              >
                <span className="tabular text-lg font-semibold text-ink">{item.value}</span>
                <span className="text-xs text-muted">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <ActivationChecklist />

          {activity.length > 0 ? (
            <section aria-label="Activity">
              <SectionHeading className="mb-2">Recent activity</SectionHeading>
              <ul className="space-y-1.5 rounded-card border border-line bg-surface p-3">
                {activity.map((entry) => (
                  <li key={entry.id} className="flex items-baseline gap-2 text-xs">
                    <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full bg-line-strong')} />
                    <span className="min-w-0 flex-1 truncate text-ink">{entry.summary}</span>
                    <span className="shrink-0 text-faint">
                      {formatDistanceToNowStrict(new Date(entry.createdAt))} ago
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

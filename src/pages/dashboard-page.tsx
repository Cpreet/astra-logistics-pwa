import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNowStrict } from 'date-fns'
import { ArrowRight, Plus } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { buttonClasses } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/card'
import { InquiryStatusBadge } from '@/components/ui/status-badge'
import { ListSkeleton } from '@/components/ui/skeleton'
import { buildAttentionQueue } from '@/domain/attention'
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

  const stats = useMemo(() => {
    const open = inquiries.filter((inquiry) => OPEN_STATUSES.has(inquiry.status))
    const quoted = inquiries.filter((inquiry) => inquiry.status === 'quoted')
    const won = inquiries.filter((inquiry) => inquiry.status === 'converted')
    return [
      { label: 'Open lanes', value: open.length, to: '/inquiries?status=open' },
      { label: 'Awaiting decision', value: quoted.length, to: '/inquiries?status=quoted' },
      { label: 'Won', value: won.length, to: '/inquiries?status=converted' },
      { label: 'Customers', value: customers.length, to: '/customers' },
    ]
  }, [inquiries, customers])

  const recentInquiries = inquiries.slice(0, 4)
  const loading = loadingCustomers || loadingInquiries

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={roleHome?.headline}
        title={user ? `Good to see you, ${user.name.split(' ')[0]}` : 'Overview'}
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

      {loading ? <ListSkeleton rows={3} /> : <AttentionQueue items={attention} />}

      <ActivationChecklist />

      <section aria-label="Pipeline">
        <SectionHeading className="mb-2">Pipeline</SectionHeading>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              to={stat.to}
              className="rounded-card border border-line bg-surface p-3 transition-colors hover:border-line-strong"
            >
              <p className="tabular text-2xl font-semibold tracking-tight text-ink">{stat.value}</p>
              <p className="mt-0.5 text-xs text-muted">{stat.label}</p>
            </Link>
          ))}
        </div>
      </section>

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
                  className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="tabular text-sm font-medium text-ink">
                        {inquiry.inquiryNumber}
                      </span>
                      <span className="truncate text-sm text-muted">
                        {inquiry.origin.code} → {inquiry.destination.code}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-faint">
                      Updated {formatDistanceToNowStrict(new Date(inquiry.updatedAt))} ago
                    </span>
                  </span>
                  <InquiryStatusBadge status={inquiry.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {activity.length > 0 ? (
        <section aria-label="Activity">
          <SectionHeading className="mb-2">Activity</SectionHeading>
          <ul className="space-y-1.5">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-baseline gap-2 text-xs">
                <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full bg-line-strong')} />
                <span className="text-ink">{entry.summary}</span>
                <span className="ml-auto shrink-0 text-faint">
                  {formatDistanceToNowStrict(new Date(entry.createdAt))} ago
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

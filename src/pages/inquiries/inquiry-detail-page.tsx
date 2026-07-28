import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { ArrowRight, Building2, CalendarClock, Package } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { InquiryStatusBadge, SyncStatusBadge } from '@/components/ui/status-badge'
import { Timeline, type TimelineStep } from '@/components/ui/timeline'
import { useToast } from '@/components/ui/toast'
import { AuditTrail } from '@/features/audit/audit-trail'
import { auditKeys } from '@/features/audit/audit-keys'
import { useAuth } from '@/features/auth/auth-context'
import { useActivation } from '@/hooks/use-activation'
import { inquiryKeys } from '@/hooks/use-inquiries'
import { outboxKey } from '@/hooks/use-outbox'
import { getCustomerById } from '@/repositories/customer-repository'
import { getInquiryById, transitionInquiry } from '@/repositories/inquiry-repository'
import type { Inquiry, InquiryStatus } from '@/types/inquiry'

const STAGES: Array<{ status: InquiryStatus; label: string }> = [
  { status: 'new', label: 'Received' },
  { status: 'qualified', label: 'Qualified' },
  { status: 'quotation_in_progress', label: 'Pricing' },
  { status: 'quoted', label: 'Quoted' },
  { status: 'converted', label: 'Won' },
]

const NEXT_ACTION: Partial<Record<InquiryStatus, { label: string; to: InquiryStatus }>> = {
  new: { label: 'Qualify lane', to: 'qualified' },
  qualified: { label: 'Start pricing', to: 'quotation_in_progress' },
  quotation_in_progress: { label: 'Mark quoted', to: 'quoted' },
  quoted: { label: 'Mark won', to: 'converted' },
}

function buildTimeline(inquiry: Inquiry): TimelineStep[] {
  if (inquiry.status === 'lost' || inquiry.status === 'cancelled') {
    return [
      ...STAGES.slice(0, 1).map((stage) => ({
        key: stage.status,
        label: stage.label,
        state: 'done' as const,
      })),
      {
        key: inquiry.status,
        label: inquiry.status === 'lost' ? 'Lost' : 'Cancelled',
        caption: `Closed ${formatDistanceToNowStrict(new Date(inquiry.updatedAt))} ago`,
        state: 'exception' as const,
      },
    ]
  }

  const currentIndex = STAGES.findIndex((stage) => stage.status === inquiry.status)
  return STAGES.map((stage, index) => ({
    key: stage.status,
    label: stage.label,
    caption:
      index === currentIndex
        ? `Updated ${formatDistanceToNowStrict(new Date(inquiry.updatedAt))} ago`
        : undefined,
    state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming',
  }))
}

export function InquiryDetailPage() {
  const { id = '' } = useParams()
  const { user, can } = useAuth()
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const { markStep } = useActivation()

  const { data: inquiry, isLoading } = useQuery({
    queryKey: inquiryKeys.detail(id),
    queryFn: () => getInquiryById(id),
    enabled: Boolean(id),
  })

  const { data: customer } = useQuery({
    queryKey: ['customers', inquiry?.customerId],
    queryFn: () => getCustomerById(inquiry!.customerId),
    enabled: Boolean(inquiry?.customerId),
  })

  const transition = useMutation({
    mutationFn: (to: InquiryStatus) => {
      if (!user) throw new Error('Not signed in')
      return transitionInquiry(user.id, id, to)
    },
    onSuccess: async (updated) => {
      await markStep('advanced_inquiry')
      if (!navigator.onLine) await markStep('worked_offline')
      await queryClient.invalidateQueries({ queryKey: inquiryKeys.detail(id) })
      await queryClient.invalidateQueries({ queryKey: inquiryKeys.all })
      await queryClient.invalidateQueries({ queryKey: auditKeys.all })
      await queryClient.invalidateQueries({ queryKey: outboxKey })
      notify({ tone: 'success', message: `Moved to ${updated.status.replaceAll('_', ' ')}` })
    },
    onError: (error) =>
      notify({
        tone: 'error',
        message: 'Transition not allowed',
        description: error instanceof Error ? error.message : undefined,
      }),
  })

  if (isLoading) {
    return <p className="text-sm text-muted">Loading inquiry…</p>
  }

  if (!inquiry) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">This inquiry no longer exists.</p>
        <Link to="/inquiries" className="text-sm font-medium text-brand hover:underline">
          Back to inquiries
        </Link>
      </div>
    )
  }

  const next = NEXT_ACTION[inquiry.status]
  const closable = !['lost', 'cancelled', 'converted'].includes(inquiry.status)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={inquiry.inquiryNumber}
        title={`${inquiry.origin.code} → ${inquiry.destination.code}`}
        description={`${inquiry.transportMode.toUpperCase()} · ${inquiry.direction} · ${inquiry.origin.name} to ${inquiry.destination.name}`}
        backTo="/inquiries"
        backLabel="Inquiries"
        actions={
          can('inquiries.write') && next ? (
            <Button loading={transition.isPending} onClick={() => transition.mutate(next.to)}>
              {next.label}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <InquiryStatusBadge status={inquiry.status} />
        <SyncStatusBadge status={inquiry.syncStatus} />
        <span className="text-xs text-faint">
          Updated {formatDistanceToNowStrict(new Date(inquiry.updatedAt))} ago
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardTitle className="mb-4 text-sm">Progress</CardTitle>
            <Timeline steps={buildTimeline(inquiry)} />
          </Card>

          <Card>
            <CardTitle className="mb-3 text-sm">Cargo</CardTitle>
            <p className="flex items-start gap-2 text-sm text-ink">
              <Package className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
              {inquiry.cargoSummary}
            </p>
            {inquiry.specialInstructions ? (
              <p className="mt-2 rounded-lg bg-raised p-2.5 text-xs text-muted">
                {inquiry.specialInstructions}
              </p>
            ) : null}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle className="mb-3 text-sm">Customer</CardTitle>
            {customer ? (
              <Link
                to={`/customers/${customer.id}`}
                className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-raised"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
                  <Building2 className="size-4 text-brand" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {customer.legalName}
                  </span>
                  <span className="block text-xs text-muted">{customer.customerCode}</span>
                </span>
              </Link>
            ) : (
              <p className="text-sm text-muted">Loading…</p>
            )}
          </Card>

          <Card>
            <CardTitle className="mb-3 text-sm">Dates</CardTitle>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 shrink-0 text-faint" aria-hidden />
                <dt className="text-muted">Requested pickup</dt>
                <dd className="ml-auto text-ink">
                  {inquiry.requestedPickupDate
                    ? format(new Date(inquiry.requestedPickupDate), 'PP')
                    : '—'}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 shrink-0 text-faint" aria-hidden />
                <dt className="text-muted">Requested delivery</dt>
                <dd className="ml-auto text-ink">
                  {inquiry.requestedDeliveryDate
                    ? format(new Date(inquiry.requestedDeliveryDate), 'PP')
                    : '—'}
                </dd>
              </div>
            </dl>
          </Card>

          {can('inquiries.write') && closable ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => transition.mutate('lost')}
              >
                Mark lost
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => transition.mutate('cancelled')}
              >
                Cancel
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <AuditTrail entityId={inquiry.id} title="History" />
    </div>
  )
}

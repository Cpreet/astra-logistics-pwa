import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { canTransitionInquiry } from '@/domain/inquiry-workflow'
import { useAuth } from '@/features/auth/auth-context'
import { inquiryKeys } from '@/hooks/use-inquiries'
import { getInquiryById, transitionInquiry } from '@/repositories/inquiry-repository'
import { getCustomerById } from '@/repositories/customer-repository'
import type { InquiryStatus } from '@/types/inquiry'

const NEXT_ACTIONS: Partial<Record<InquiryStatus, { label: string; to: InquiryStatus }[]>> = {
  new: [
    { label: 'Qualify', to: 'qualified' },
    { label: 'Start quoting', to: 'quotation_in_progress' },
  ],
  qualified: [{ label: 'Start quoting', to: 'quotation_in_progress' }],
  quotation_in_progress: [{ label: 'Mark quoted', to: 'quoted' }],
  quoted: [{ label: 'Mark converted', to: 'converted' }],
}

export function InquiryDetailPage() {
  const { id = '' } = useParams()
  const { user, can } = useAuth()
  const queryClient = useQueryClient()

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inquiryKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: inquiryKeys.all })
    },
  })

  if (isLoading) return <p className="text-sm text-slate-500">Loading inquiry…</p>
  if (!inquiry) {
    return (
      <div>
        <p className="text-slate-400">Inquiry not found.</p>
        <Link to="/inquiries" className="text-sky-400">
          Back
        </Link>
      </div>
    )
  }

  const actions = NEXT_ACTIONS[inquiry.status] ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={inquiry.inquiryNumber}
        description={`${inquiry.transportMode.toUpperCase()} · ${inquiry.direction}`}
        actions={
          <Link to="/inquiries">
            <Button variant="secondary" className="min-h-11">
              Back
            </Button>
          </Link>
        }
      />

      <Badge variant="info">{inquiry.status.replaceAll('_', ' ')}</Badge>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Customer</CardTitle>
          <CardDescription className="mt-2 text-sm text-slate-300">
            {customer ? (
              <Link to={`/customers/${customer.id}`} className="text-sky-400 hover:underline">
                {customer.legalName}
              </Link>
            ) : (
              'Loading…'
            )}
          </CardDescription>
        </Card>
        <Card>
          <CardTitle>Lane</CardTitle>
          <CardDescription className="mt-2 text-sm">
            {inquiry.origin.code} ({inquiry.origin.name}) → {inquiry.destination.code} (
            {inquiry.destination.name})
          </CardDescription>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle>Cargo</CardTitle>
          <CardDescription className="mt-2 text-sm">{inquiry.cargoSummary}</CardDescription>
          {inquiry.specialInstructions ? (
            <p className="mt-2 text-xs text-slate-500">{inquiry.specialInstructions}</p>
          ) : null}
          <p className="mt-3 text-xs text-slate-600">
            Created {format(new Date(inquiry.createdAt), 'PPpp')}
          </p>
        </Card>
      </div>

      {can('inquiries.write') ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {actions.map((action) =>
            canTransitionInquiry(inquiry.status, action.to) ? (
              <Button
                key={action.to}
                className="min-h-11 w-full sm:w-auto"
                disabled={transition.isPending}
                onClick={() => transition.mutate(action.to)}
              >
                {action.label}
              </Button>
            ) : null,
          )}
          {!['lost', 'cancelled', 'converted'].includes(inquiry.status) ? (
            <>
              <Button
                variant="secondary"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => transition.mutate('lost')}
              >
                Mark lost
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => transition.mutate('cancelled')}
              >
                Cancel
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

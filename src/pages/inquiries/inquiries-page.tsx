import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/features/auth/auth-context'
import { useInquiries } from '@/hooks/use-inquiries'
import { useCustomers } from '@/hooks/use-customers'

export function InquiriesPage() {
  const { can } = useAuth()
  const { data: inquiries = [], isLoading } = useInquiries()
  const { data: customers = [] } = useCustomers()
  const customerName = (id: string) => customers.find((c) => c.id === id)?.legalName ?? 'Customer'

  return (
    <div>
      <PageHeader
        title="Inquiries"
        description="Air-focused sales pipeline with validated status transitions."
        actions={
          can('inquiries.write') ? (
            <Link to="/inquiries/new">
              <Button className="min-h-11 w-full sm:w-auto">New inquiry</Button>
            </Link>
          ) : null
        }
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading inquiries…</p>
      ) : inquiries.length === 0 ? (
        <EmptyState
          title="No inquiries"
          description="Capture a customer lane request — works fully offline."
          action={
            can('inquiries.write') ? (
              <Link to="/inquiries/new">
                <Button>New inquiry</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <Link
                to={`/inquiries/${inquiry.id}`}
                className="flex min-h-[4.5rem] flex-col justify-center gap-1 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 active:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-100">{inquiry.inquiryNumber}</p>
                  <p className="truncate text-sm text-slate-400">
                    {customerName(inquiry.customerId)} · {inquiry.origin.code} →{' '}
                    {inquiry.destination.code}
                  </p>
                  <p className="text-xs text-slate-600">
                    {format(new Date(inquiry.createdAt), 'MMM d, yyyy')} · {inquiry.transportMode}{' '}
                    {inquiry.direction}
                  </p>
                </div>
                <Badge variant="info" className="self-start sm:self-center">
                  {inquiry.status.replaceAll('_', ' ')}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

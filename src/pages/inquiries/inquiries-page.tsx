import { formatDistanceToNowStrict } from 'date-fns'
import { FileText, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { ListSkeleton } from '@/components/ui/skeleton'
import { InquiryStatusBadge } from '@/components/ui/status-badge'
import { useAuth } from '@/features/auth/auth-context'
import { useCustomers } from '@/hooks/use-customers'
import { useInquiries } from '@/hooks/use-inquiries'
import type { Inquiry } from '@/types/inquiry'

type FilterKey = 'open' | 'quoted' | 'converted' | 'all'

const FILTERS: Record<FilterKey, (inquiry: Inquiry) => boolean> = {
  open: (inquiry) => ['new', 'qualified', 'quotation_in_progress'].includes(inquiry.status),
  quoted: (inquiry) => inquiry.status === 'quoted',
  converted: (inquiry) => inquiry.status === 'converted',
  all: () => true,
}

export function InquiriesPage() {
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = (searchParams.get('status') as FilterKey) ?? 'open'
  const [filter, setFilter] = useState<FilterKey>(initial in FILTERS ? initial : 'open')
  const [term, setTerm] = useState('')

  const { data: inquiries = [], isLoading } = useInquiries()
  const { data: customers = [] } = useCustomers()

  const customerName = (id: string) =>
    customers.find((customer) => customer.id === id)?.legalName ?? 'Unknown customer'

  const counts = useMemo(
    () => ({
      open: inquiries.filter(FILTERS.open).length,
      quoted: inquiries.filter(FILTERS.quoted).length,
      converted: inquiries.filter(FILTERS.converted).length,
      all: inquiries.length,
    }),
    [inquiries],
  )

  const visible = useMemo(() => {
    const search = term.trim().toLowerCase()
    return inquiries.filter(FILTERS[filter]).filter((inquiry) => {
      if (!search) return true
      return (
        inquiry.inquiryNumber.toLowerCase().includes(search) ||
        inquiry.origin.code.toLowerCase().includes(search) ||
        inquiry.destination.code.toLowerCase().includes(search) ||
        inquiry.cargoSummary.toLowerCase().includes(search) ||
        customerName(inquiry.customerId).toLowerCase().includes(search)
      )
    })
  }, [inquiries, filter, term, customers])

  return (
    <div>
      <PageHeader
        title="Inquiries"
        description="Every lane request, with the oldest risk surfaced first."
        actions={
          can('inquiries.write') ? (
            <Link to="/inquiries/new" className={buttonClasses('primary', 'md')}>
              <Plus className="size-4" aria-hidden />
              New inquiry
            </Link>
          ) : null
        }
      />

      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search lane, number, or customer"
            aria-label="Search inquiries"
            className="pl-9"
            enterKeyHint="search"
          />
        </div>
        <Segmented
          label="Filter inquiries"
          value={filter}
          onChange={(next) => {
            setFilter(next)
            setSearchParams(next === 'open' ? {} : { status: next }, { replace: true })
          }}
          options={[
            { value: 'open', label: 'Open', count: counts.open },
            { value: 'quoted', label: 'Quoted', count: counts.quoted },
            { value: 'converted', label: 'Won', count: counts.converted },
            { value: 'all', label: 'All', count: counts.all },
          ]}
        />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : inquiries.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Your pipeline starts here"
          description="Inquiries capture the lane, cargo, and dates a customer asks for — the first step toward a quotation."
          value="Teams that log every request quote faster and lose fewer lanes."
          action={
            can('inquiries.write') ? (
              <Link to="/inquiries/new" className={buttonClasses('primary', 'md')}>
                <Plus className="size-4" aria-hidden />
                Capture an inquiry
              </Link>
            ) : undefined
          }
          secondaryAction={
            <span className="text-xs text-faint">Lane templates fill most fields for you</span>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try a different search term or switch the filter above."
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {visible.map((inquiry) => (
            <li key={inquiry.id}>
              <Link
                to={`/inquiries/${inquiry.id}`}
                className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className="tabular text-sm font-semibold text-ink">
                      {inquiry.origin.code} → {inquiry.destination.code}
                    </span>
                    <span className="tabular text-xs text-faint">{inquiry.inquiryNumber}</span>
                  </span>
                  <span className="block truncate text-sm text-muted">
                    {customerName(inquiry.customerId)}
                  </span>
                  <span className="block text-xs text-faint">
                    {inquiry.transportMode.toUpperCase()} · {inquiry.direction} · updated{' '}
                    {formatDistanceToNowStrict(new Date(inquiry.updatedAt))} ago
                  </span>
                </span>
                <InquiryStatusBadge status={inquiry.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { formatDistanceToNowStrict } from 'date-fns'
import { FileText, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { buttonClasses } from '@/components/ui/button'
import { CellMuted, CellStrong, DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Segmented } from '@/components/ui/segmented'
import { ListSkeleton } from '@/components/ui/skeleton'
import { InquiryStatusBadge } from '@/components/ui/status-badge'
import { ResultCount, Toolbar } from '@/components/ui/toolbar'
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

  const columns: Column<Inquiry>[] = [
    {
      id: 'number',
      header: 'Inquiry',
      width: 'w-36',
      numeric: true,
      sortValue: (inquiry) => inquiry.inquiryNumber,
      cell: (inquiry) => <CellStrong>{inquiry.inquiryNumber}</CellStrong>,
    },
    {
      id: 'lane',
      header: 'Lane',
      width: 'w-40',
      sortValue: (inquiry) => `${inquiry.origin.code}${inquiry.destination.code}`,
      cell: (inquiry) => (
        <span className="tabular whitespace-nowrap font-medium text-ink">
          {inquiry.origin.code} <span className="text-faint">→</span> {inquiry.destination.code}
        </span>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      sortValue: (inquiry) => customerName(inquiry.customerId),
      cell: (inquiry) => (
        <>
          <CellStrong>{customerName(inquiry.customerId)}</CellStrong>
          <CellMuted>{inquiry.cargoSummary}</CellMuted>
        </>
      ),
    },
    {
      id: 'mode',
      header: 'Mode',
      width: 'w-28',
      hideBelow: 'md',
      sortValue: (inquiry) => inquiry.transportMode,
      cell: (inquiry) => (
        <span className="whitespace-nowrap text-xs text-muted">
          {inquiry.transportMode.toUpperCase()} · {inquiry.direction}
        </span>
      ),
    },
    {
      id: 'pickup',
      header: 'Pickup',
      width: 'w-28',
      hideBelow: 'lg',
      numeric: true,
      sortValue: (inquiry) => inquiry.requestedPickupDate ?? '',
      cell: (inquiry) => (
        <span className="whitespace-nowrap text-xs text-muted">
          {inquiry.requestedPickupDate
            ? new Date(inquiry.requestedPickupDate).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
    {
      id: 'updated',
      header: 'Updated',
      width: 'w-28',
      hideBelow: 'sm',
      numeric: true,
      sortValue: (inquiry) => inquiry.updatedAt,
      cell: (inquiry) => (
        <span className="whitespace-nowrap text-xs text-muted">
          {formatDistanceToNowStrict(new Date(inquiry.updatedAt))} ago
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: 'w-28',
      align: 'right',
      sortValue: (inquiry) => inquiry.status,
      cell: (inquiry) => <InquiryStatusBadge status={inquiry.status} />,
    },
  ]

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

      <Toolbar
        searchValue={term}
        onSearchChange={setTerm}
        searchLabel="Search inquiries"
        searchPlaceholder="Search lane, number, or customer"
        filters={
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
        }
        trailing={<ResultCount shown={visible.length} total={inquiries.length} noun="inquiries" />}
      />

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
        <DataTable
          caption="Inquiries"
          rows={visible}
          columns={columns}
          getRowId={(inquiry) => inquiry.id}
          getRowHref={(inquiry) => `/inquiries/${inquiry.id}`}
          initialSort={{ columnId: 'updated', direction: 'desc' }}
        />
      )}
    </div>
  )
}

import { Plus, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonClasses } from '@/components/ui/button'
import { CellMuted, CellStrong, DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Segmented } from '@/components/ui/segmented'
import { ListSkeleton } from '@/components/ui/skeleton'
import { CustomerStatusBadge } from '@/components/ui/status-badge'
import { ResultCount, Toolbar } from '@/components/ui/toolbar'
import { useAuth } from '@/features/auth/auth-context'
import { useCustomers } from '@/hooks/use-customers'
import type { Customer } from '@/types/customer'

type FilterKey = 'all' | 'active' | 'lead' | 'attention'

const FILTERS: Record<FilterKey, (customer: Customer) => boolean> = {
  all: () => true,
  active: (customer) => customer.status === 'active',
  lead: (customer) => customer.status === 'lead',
  attention: (customer) =>
    customer.status === 'credit_hold' || customer.complianceStatus !== 'clear',
}

export function CustomersPage() {
  const { can } = useAuth()
  const [searchParams] = useSearchParams()
  const view = searchParams.get('view')
  const [filter, setFilter] = useState<FilterKey>(
    view === 'credit' || view === 'compliance' ? 'attention' : 'all',
  )
  const [term, setTerm] = useState('')
  const { data: customers = [], isLoading } = useCustomers()

  const counts = useMemo(
    () => ({
      all: customers.length,
      active: customers.filter(FILTERS.active).length,
      lead: customers.filter(FILTERS.lead).length,
      attention: customers.filter(FILTERS.attention).length,
    }),
    [customers],
  )

  const visible = useMemo(() => {
    const search = term.trim().toLowerCase()
    return customers.filter(FILTERS[filter]).filter((customer) => {
      if (!search) return true
      return (
        customer.legalName.toLowerCase().includes(search) ||
        customer.customerCode.toLowerCase().includes(search) ||
        (customer.tradingName ?? '').toLowerCase().includes(search) ||
        customer.billingAddress.city.toLowerCase().includes(search)
      )
    })
  }, [customers, filter, term])

  const columns: Column<Customer>[] = [
    {
      id: 'code',
      header: 'Code',
      width: 'w-28',
      numeric: true,
      sortValue: (customer) => customer.customerCode,
      cell: (customer) => <CellStrong>{customer.customerCode}</CellStrong>,
    },
    {
      id: 'name',
      header: 'Customer',
      sortValue: (customer) => customer.legalName.toLowerCase(),
      cell: (customer) => (
        <>
          <CellStrong>{customer.legalName}</CellStrong>
          {customer.tradingName ? <CellMuted>{customer.tradingName}</CellMuted> : null}
        </>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      width: 'w-44',
      hideBelow: 'md',
      sortValue: (customer) => customer.billingAddress.countryCode,
      cell: (customer) => (
        <span className="truncate text-xs text-muted">
          {customer.billingAddress.city}, {customer.billingAddress.countryCode}
        </span>
      ),
    },
    {
      id: 'terms',
      header: 'Terms',
      width: 'w-24',
      hideBelow: 'lg',
      numeric: true,
      align: 'right',
      sortValue: (customer) => customer.paymentTermsDays,
      cell: (customer) => (
        <span className="whitespace-nowrap text-xs text-muted">{customer.paymentTermsDays} days</span>
      ),
    },
    {
      id: 'credit',
      header: 'Credit limit',
      width: 'w-32',
      hideBelow: 'md',
      numeric: true,
      align: 'right',
      sortValue: (customer) => customer.creditLimit,
      cell: (customer) => (
        <span className="whitespace-nowrap text-xs text-muted">
          {new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: customer.currency,
            maximumFractionDigits: 0,
          }).format(customer.creditLimit)}
        </span>
      ),
    },
    {
      id: 'compliance',
      header: 'Compliance',
      width: 'w-32',
      hideBelow: 'lg',
      sortValue: (customer) => customer.complianceStatus,
      cell: (customer) =>
        customer.complianceStatus === 'clear' ? (
          <span className="text-xs text-muted">Clear</span>
        ) : (
          <Badge tone={customer.complianceStatus === 'hold' ? 'danger' : 'warning'}>
            {customer.complianceStatus === 'hold' ? 'Hold' : 'Review'}
          </Badge>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      width: 'w-28',
      align: 'right',
      sortValue: (customer) => customer.status,
      cell: (customer) => <CustomerStatusBadge status={customer.status} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Shippers, consignees, and brokers with credit and compliance context."
        actions={
          can('customers.write') ? (
            <Link to="/customers/new" className={buttonClasses('primary', 'md')}>
              <Plus className="size-4" aria-hidden />
              Add customer
            </Link>
          ) : null
        }
      />

      <Toolbar
        searchValue={term}
        onSearchChange={setTerm}
        searchLabel="Search customers"
        searchPlaceholder="Search name, code, or city"
        filters={
          <Segmented
            label="Filter customers"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'active', label: 'Active', count: counts.active },
              { value: 'lead', label: 'Leads', count: counts.lead },
              { value: 'attention', label: 'Attention', count: counts.attention },
            ]}
          />
        }
        trailing={<ResultCount shown={visible.length} total={customers.length} noun="customers" />}
      />

      {isLoading ? (
        <ListSkeleton />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Add your first customer"
          description="Customers anchor inquiries, quotations, and invoices. You only need a name and a contact to begin."
          value="Everything else can be filled in later."
          action={
            can('customers.write') ? (
              <Link to="/customers/new" className={buttonClasses('primary', 'md')}>
                <Plus className="size-4" aria-hidden />
                Add customer
              </Link>
            ) : undefined
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Adjust your search or filter." />
      ) : (
        <DataTable
          caption="Customers"
          rows={visible}
          columns={columns}
          getRowId={(customer) => customer.id}
          getRowHref={(customer) => `/customers/${customer.id}`}
          initialSort={{ columnId: 'name', direction: 'asc' }}
        />
      )}
    </div>
  )
}

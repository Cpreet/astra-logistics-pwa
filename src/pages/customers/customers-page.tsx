import { Plus, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { ListSkeleton } from '@/components/ui/skeleton'
import { CustomerStatusBadge } from '@/components/ui/status-badge'
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

      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search name, code, or city"
            aria-label="Search customers"
            className="pl-9"
            enterKeyHint="search"
          />
        </div>
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
      </div>

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
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {visible.map((customer) => (
            <li key={customer.id}>
              <Link
                to={`/customers/${customer.id}`}
                className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-raised text-xs font-semibold text-muted">
                  {customer.legalName.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {customer.legalName}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {customer.customerCode} · {customer.billingAddress.city},{' '}
                    {customer.billingAddress.countryCode}
                  </span>
                </span>
                <CustomerStatusBadge status={customer.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

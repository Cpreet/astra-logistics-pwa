import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/features/auth/auth-context'
import { useCustomers } from '@/hooks/use-customers'
import type { CustomerStatus } from '@/types/customer'

function statusVariant(status: CustomerStatus) {
  switch (status) {
    case 'active':
      return 'success'
    case 'credit_hold':
      return 'danger'
    case 'lead':
      return 'info'
    default:
      return 'default'
  }
}

export function CustomersPage() {
  const { can } = useAuth()
  const { data: customers = [], isLoading } = useCustomers()

  return (
    <div>
      <PageHeader
        title="Customers"
        description="CRM records stored locally. Optimized for thumb-friendly navigation on phones."
        actions={
          can('customers.write') ? (
            <Link to="/customers/new">
              <Button className="min-h-11 w-full sm:w-auto">Add customer</Button>
            </Link>
          ) : null
        }
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading customers…</p>
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Create your first customer while offline — changes sync later."
          action={
            can('customers.write') ? (
              <Link to="/customers/new">
                <Button>Add customer</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <li key={customer.id}>
              <Link
                to={`/customers/${customer.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition active:scale-[0.99] hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{customer.legalName}</p>
                    <p className="text-xs text-slate-500">{customer.customerCode}</p>
                  </div>
                  <Badge variant={statusVariant(customer.status)}>{customer.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {customer.billingAddress.city}, {customer.billingAddress.countryCode}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Updated {format(new Date(customer.updatedAt), 'MMM d, yyyy')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

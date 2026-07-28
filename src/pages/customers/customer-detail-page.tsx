import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import {
  getCustomerById,
  listContactsForCustomer,
  updateCustomerStatus,
} from '@/repositories/customer-repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerKeys } from '@/hooks/use-customers'
import type { CustomerStatus } from '@/types/customer'

export function CustomerDetailPage() {
  const { id = '' } = useParams()
  const { user, can } = useAuth()
  const queryClient = useQueryClient()

  const { data: customer, isLoading } = useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomerById(id),
    enabled: Boolean(id),
  })

  const { data: contacts = [] } = useQuery({
    queryKey: ['customers', id, 'contacts'],
    queryFn: () => listContactsForCustomer(id),
    enabled: Boolean(id),
  })

  const statusMutation = useMutation({
    mutationFn: (status: CustomerStatus) => {
      if (!user) throw new Error('Not signed in')
      return updateCustomerStatus(user.id, id, status)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading customer…</p>
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Customer not found.</p>
        <Link to="/customers" className="text-sky-400 hover:underline">
          Back to customers
        </Link>
      </div>
    )
  }

  const primary = contacts.find((c) => c.isPrimary) ?? contacts[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.legalName}
        description={`${customer.customerCode} · ${customer.customerType}`}
        actions={
          <Link to="/customers">
            <Button variant="secondary" className="min-h-11">
              Back
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>{customer.status}</Badge>
        <Badge variant={customer.complianceStatus === 'clear' ? 'success' : 'warning'}>
          Compliance: {customer.complianceStatus}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Commercial</CardTitle>
          <CardDescription className="mt-3 space-y-1 text-sm">
            <p>Credit limit: {customer.currency} {customer.creditLimit.toLocaleString()}</p>
            <p>Payment terms: {customer.paymentTermsDays} days</p>
            <p>Updated {format(new Date(customer.updatedAt), 'PPpp')}</p>
          </CardDescription>
        </Card>
        <Card>
          <CardTitle>Primary contact</CardTitle>
          {primary ? (
            <CardDescription className="mt-3 space-y-1 text-sm">
              <p className="text-slate-200">{primary.name}</p>
              <p>{primary.email}</p>
              {primary.phone ? <p>{primary.phone}</p> : null}
            </CardDescription>
          ) : (
            <CardDescription className="mt-3">No contacts on file</CardDescription>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle>Billing address</CardTitle>
          <CardDescription className="mt-3 text-sm">
            <p>{customer.billingAddress.line1}</p>
            <p>
              {customer.billingAddress.city}, {customer.billingAddress.postalCode}
            </p>
            <p>{customer.billingAddress.countryCode}</p>
          </CardDescription>
        </Card>
      </div>

      {can('customers.write') ? (
        <div className="flex flex-wrap gap-2">
          {customer.status !== 'active' ? (
            <Button
              className="min-h-11 flex-1 sm:flex-none"
              onClick={() => statusMutation.mutate('active')}
            >
              Mark active
            </Button>
          ) : null}
          {customer.status !== 'credit_hold' ? (
            <Button
              variant="secondary"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={() => statusMutation.mutate('credit_hold')}
            >
              Credit hold
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

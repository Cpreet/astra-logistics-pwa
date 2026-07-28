import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Mail, Phone, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { Button, buttonClasses } from '@/components/ui/button'
import { Card, CardTitle, SectionHeading } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CustomerStatusBadge,
  humanize,
  InquiryStatusBadge,
  SyncStatusBadge,
} from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
import { AuditTrail } from '@/features/audit/audit-trail'
import { auditKeys } from '@/features/audit/audit-keys'
import { useAuth } from '@/features/auth/auth-context'
import { customerKeys } from '@/hooks/use-customers'
import { useInquiries } from '@/hooks/use-inquiries'
import { outboxKey } from '@/hooks/use-outbox'
import {
  getCustomerById,
  listContactsForCustomer,
  updateCustomerStatus,
} from '@/repositories/customer-repository'
import type { CustomerStatus } from '@/types/customer'

export function CustomerDetailPage() {
  const { id = '' } = useParams()
  const { user, can } = useAuth()
  const queryClient = useQueryClient()
  const { notify } = useToast()

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

  const { data: inquiries = [] } = useInquiries()
  const customerInquiries = inquiries.filter((inquiry) => inquiry.customerId === id)

  const statusMutation = useMutation({
    mutationFn: (status: CustomerStatus) => {
      if (!user) throw new Error('Not signed in')
      return updateCustomerStatus(user.id, id, status)
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) })
      await queryClient.invalidateQueries({ queryKey: customerKeys.all })
      await queryClient.invalidateQueries({ queryKey: auditKeys.all })
      await queryClient.invalidateQueries({ queryKey: outboxKey })
      notify({ tone: 'success', message: `Status set to ${updated.status.replaceAll('_', ' ')}` })
    },
  })

  if (isLoading) return <p className="text-sm text-muted">Loading customer…</p>

  if (!customer) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">This customer no longer exists.</p>
        <Link to="/customers" className="text-sm font-medium text-brand hover:underline">
          Back to customers
        </Link>
      </div>
    )
  }

  const primary = contacts.find((contact) => contact.isPrimary) ?? contacts[0]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={customer.customerCode}
        title={customer.legalName}
        description={
          customer.tradingName
            ? `${humanize(customer.customerType)} · trading as ${customer.tradingName}`
            : humanize(customer.customerType)
        }
        backTo="/customers"
        backLabel="Customers"
        actions={
          can('inquiries.write') ? (
            <Link to="/inquiries/new" className={buttonClasses('primary', 'md')}>
              <Plus className="size-4" aria-hidden />
              New inquiry
            </Link>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <CustomerStatusBadge status={customer.status} />
        <Badge tone={customer.complianceStatus === 'clear' ? 'success' : 'warning'}>
          Compliance: {customer.complianceStatus}
        </Badge>
        <SyncStatusBadge status={customer.syncStatus} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle className="mb-3 text-sm">Primary contact</CardTitle>
          {primary ? (
            <div className="space-y-1.5 text-sm">
              <p className="font-medium text-ink">{primary.name}</p>
              <a
                href={`mailto:${primary.email}`}
                className="flex items-center gap-2 text-muted hover:text-brand"
              >
                <Mail className="size-3.5 shrink-0" aria-hidden />
                {primary.email}
              </a>
              {primary.phone ? (
                <a
                  href={`tel:${primary.phone}`}
                  className="flex items-center gap-2 text-muted hover:text-brand"
                >
                  <Phone className="size-3.5 shrink-0" aria-hidden />
                  {primary.phone}
                </a>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted">No contacts recorded.</p>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-3 text-sm">Commercial</CardTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Credit limit</dt>
              <dd className="tabular text-ink">
                {customer.creditLimit.toLocaleString(undefined, {
                  style: 'currency',
                  currency: customer.currency,
                  maximumFractionDigits: 0,
                })}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Payment terms</dt>
              <dd className="tabular text-ink">{customer.paymentTermsDays} days</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Updated</dt>
              <dd className="text-ink">{format(new Date(customer.updatedAt), 'PP')}</dd>
            </div>
          </dl>
        </Card>

        <Card className="sm:col-span-2">
          <CardTitle className="mb-2 text-sm">Billing address</CardTitle>
          <address className="text-sm not-italic leading-relaxed text-muted">
            {customer.billingAddress.line1 !== '—' ? (
              <>
                {customer.billingAddress.line1}
                <br />
              </>
            ) : null}
            {customer.billingAddress.city}
            {customer.billingAddress.postalCode !== '—'
              ? `, ${customer.billingAddress.postalCode}`
              : ''}
            <br />
            {customer.billingAddress.countryCode}
          </address>
        </Card>
      </div>

      <section aria-label="Customer inquiries">
        <SectionHeading className="mb-2">Inquiries ({customerInquiries.length})</SectionHeading>
        {customerInquiries.length === 0 ? (
          <p className="rounded-card border border-dashed border-line-strong bg-surface p-4 text-sm text-muted">
            No inquiries for this customer yet.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {customerInquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <Link
                  to={`/inquiries/${inquiry.id}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
                >
                  <span className="min-w-0 flex-1">
                    <span className="tabular block text-sm font-medium text-ink">
                      {inquiry.origin.code} → {inquiry.destination.code}
                    </span>
                    <span className="block text-xs text-faint">{inquiry.inquiryNumber}</span>
                  </span>
                  <InquiryStatusBadge status={inquiry.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {can('customers.write') ? (
        <section aria-label="Account actions">
          <SectionHeading className="mb-2">Account actions</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {customer.status !== 'active' ? (
              <Button
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate('active')}
              >
                Activate account
              </Button>
            ) : null}
            {customer.status !== 'credit_hold' ? (
              <Button
                variant="secondary"
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate('credit_hold')}
              >
                Place on credit hold
              </Button>
            ) : null}
            {customer.status !== 'inactive' ? (
              <Button
                variant="ghost"
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate('inactive')}
              >
                Deactivate
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      <AuditTrail entityId={customer.id} />
    </div>
  )
}

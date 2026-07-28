import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { FormActions } from '@/components/layout/form-actions'
import { PageHeader } from '@/components/layout/page-header'
import { Button, buttonClasses } from '@/components/ui/button'
import { Field, FormSection, Input, Select } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/auth-context'
import { useActivation } from '@/hooks/use-activation'
import { customerKeys } from '@/hooks/use-customers'
import { outboxKey } from '@/hooks/use-outbox'
import { createCustomer } from '@/repositories/customer-repository'

const schema = z.object({
  legalName: z.string().min(2, 'Enter the registered company name'),
  contactName: z.string().min(2, 'Who should we contact?'),
  contactEmail: z.string().email('Enter a valid email'),
  city: z.string().min(2, 'City is required'),
  countryCode: z.string().min(2, 'Two-letter code').max(2),
  customerType: z.enum(['shipper', 'consignee', 'broker', 'direct']),
  status: z.enum(['lead', 'active', 'credit_hold', 'inactive']),
  tradingName: z.string().optional(),
  contactPhone: z.string().optional(),
  line1: z.string().optional(),
  postalCode: z.string().optional(),
  currency: z.string().min(3).max(3),
  creditLimit: z.number().min(0),
  paymentTermsDays: z.number().int().min(0),
  taxIdentifier: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function CustomerFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const { markStep } = useActivation()
  const [showMore, setShowMore] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      legalName: '',
      contactName: '',
      contactEmail: '',
      city: '',
      countryCode: 'US',
      customerType: 'shipper',
      status: 'lead',
      currency: 'USD',
      creditLimit: 50_000,
      paymentTermsDays: 30,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!user) throw new Error('Not signed in')
      return createCustomer(user.id, {
        legalName: values.legalName,
        tradingName: values.tradingName || null,
        customerType: values.customerType,
        taxIdentifier: values.taxIdentifier || null,
        registrationNumber: null,
        creditLimit: values.creditLimit,
        paymentTermsDays: values.paymentTermsDays,
        currency: values.currency.toUpperCase(),
        status: values.status,
        billingAddress: {
          line1: values.line1 || '—',
          city: values.city,
          postalCode: values.postalCode || '—',
          countryCode: values.countryCode.toUpperCase(),
        },
        shippingAddresses: [],
        complianceStatus: 'clear',
        notes: null,
        contactName: values.contactName,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
      })
    },
    onSuccess: async ({ customer }) => {
      await markStep('created_customer')
      if (!navigator.onLine) await markStep('worked_offline')
      await queryClient.invalidateQueries({ queryKey: customerKeys.all })
      await queryClient.invalidateQueries({ queryKey: outboxKey })
      notify({
        tone: 'success',
        message: `${customer.legalName} added`,
        description: navigator.onLine ? 'Queued for sync' : 'Saved offline on this device',
      })
      navigate(`/customers/${customer.id}`, { replace: true })
    },
    onError: () => notify({ tone: 'error', message: 'Could not save the customer' }),
  })

  return (
    <div>
      <PageHeader
        title="Add customer"
        description="Four fields now, the rest whenever you need them."
        backTo="/customers"
        backLabel="Customers"
      />

      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <FormSection title="Essentials">
          <Field
            label="Legal name"
            htmlFor="legalName"
            error={errors.legalName?.message}
            className="sm:col-span-2"
          >
            <Input
              id="legalName"
              autoFocus
              autoComplete="organization"
              placeholder="Acme Aero Components Ltd"
              {...register('legalName')}
            />
          </Field>

          <Field label="Contact name" htmlFor="contactName" error={errors.contactName?.message}>
            <Input id="contactName" autoComplete="name" {...register('contactName')} />
          </Field>

          <Field label="Contact email" htmlFor="contactEmail" error={errors.contactEmail?.message}>
            <Input
              id="contactEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="next"
              {...register('contactEmail')}
            />
          </Field>

          <Field label="City" htmlFor="city" error={errors.city?.message}>
            <Input id="city" autoComplete="address-level2" {...register('city')} />
          </Field>

          <Field label="Country" htmlFor="countryCode" error={errors.countryCode?.message}>
            <Input
              id="countryCode"
              maxLength={2}
              autoCapitalize="characters"
              className="uppercase"
              {...register('countryCode')}
            />
          </Field>
        </FormSection>

        <div className="rounded-card border border-line bg-surface shadow-card">
          <button
            type="button"
            onClick={() => setShowMore((value) => !value)}
            aria-expanded={showMore}
            className="flex min-h-12 w-full items-center justify-between gap-2 px-4 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">Commercial details</span>
              <span className="block text-xs text-muted">
                Type, credit limit, terms, tax reference — all optional now
              </span>
            </span>
            {showMore ? (
              <ChevronUp className="size-4 shrink-0 text-faint" aria-hidden />
            ) : (
              <ChevronDown className="size-4 shrink-0 text-faint" aria-hidden />
            )}
          </button>

          {showMore ? (
            <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2">
              <Field label="Trading name" htmlFor="tradingName" optional>
                <Input id="tradingName" {...register('tradingName')} />
              </Field>
              <Field label="Contact phone" htmlFor="contactPhone" optional>
                <Input id="contactPhone" type="tel" inputMode="tel" {...register('contactPhone')} />
              </Field>
              <Field label="Customer type" htmlFor="customerType">
                <Select id="customerType" {...register('customerType')}>
                  <option value="shipper">Shipper</option>
                  <option value="consignee">Consignee</option>
                  <option value="broker">Broker</option>
                  <option value="direct">Direct</option>
                </Select>
              </Field>
              <Field label="Status" htmlFor="status">
                <Select id="status" {...register('status')}>
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="credit_hold">Credit hold</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>
              <Field label="Address line" htmlFor="line1" optional>
                <Input id="line1" autoComplete="street-address" {...register('line1')} />
              </Field>
              <Field label="Postal code" htmlFor="postalCode" optional>
                <Input id="postalCode" autoComplete="postal-code" {...register('postalCode')} />
              </Field>
              <Field label="Currency" htmlFor="currency">
                <Input id="currency" maxLength={3} className="uppercase" {...register('currency')} />
              </Field>
              <Field label="Credit limit" htmlFor="creditLimit">
                <Input
                  id="creditLimit"
                  type="number"
                  inputMode="decimal"
                  {...register('creditLimit', { valueAsNumber: true })}
                />
              </Field>
              <Field label="Payment terms (days)" htmlFor="paymentTermsDays">
                <Input
                  id="paymentTermsDays"
                  type="number"
                  inputMode="numeric"
                  {...register('paymentTermsDays', { valueAsNumber: true })}
                />
              </Field>
              <Field label="Tax reference" htmlFor="taxIdentifier" optional>
                <Input id="taxIdentifier" {...register('taxIdentifier')} />
              </Field>
            </div>
          ) : null}
        </div>

        <FormActions>
          <Link to="/customers" className={buttonClasses('secondary', 'md')}>
            Cancel
          </Link>
          <Button type="submit" loading={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save customer'}
          </Button>
        </FormActions>
      </form>
    </div>
  )
}

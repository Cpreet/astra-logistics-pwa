import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/auth-context'
import { customerKeys } from '@/hooks/use-customers'
import { createCustomer } from '@/repositories/customer-repository'

const schema = z.object({
  legalName: z.string().min(2, 'Legal name is required'),
  tradingName: z.string().optional(),
  customerType: z.enum(['shipper', 'consignee', 'broker', 'direct']),
  status: z.enum(['lead', 'active', 'credit_hold', 'inactive']),
  currency: z.string().min(3).max(3),
  creditLimit: z.number().min(0),
  paymentTermsDays: z.number().int().min(0),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  line1: z.string().min(2),
  city: z.string().min(2),
  postalCode: z.string().min(2),
  countryCode: z.string().min(2).max(2),
})

type FormValues = z.infer<typeof schema>

export function CustomerFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerType: 'shipper',
      status: 'lead',
      currency: 'USD',
      creditLimit: 50_000,
      paymentTermsDays: 30,
      line1: '',
      city: '',
      postalCode: '',
      countryCode: 'US',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!user) throw new Error('Not signed in')
      return createCustomer(user.id, {
        legalName: values.legalName,
        tradingName: values.tradingName,
        customerType: values.customerType,
        taxIdentifier: null,
        registrationNumber: null,
        creditLimit: values.creditLimit,
        paymentTermsDays: values.paymentTermsDays,
        currency: values.currency.toUpperCase(),
        status: values.status,
        billingAddress: {
          line1: values.line1,
          city: values.city,
          postalCode: values.postalCode,
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
    onSuccess: ({ customer }) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all })
      navigate(`/customers/${customer.id}`)
    },
  })

  return (
    <div>
      <PageHeader title="New customer" description="Capture shipper or consignee details for air freight quoting." />
      <form
        className="space-y-6"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Company</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="legalName">Legal name</Label>
              <Input id="legalName" {...register('legalName')} />
              {errors.legalName ? (
                <p className="mt-1 text-xs text-red-400">{errors.legalName.message}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="tradingName">Trading name</Label>
              <Input id="tradingName" {...register('tradingName')} />
            </div>
            <div>
              <Label htmlFor="customerType">Type</Label>
              <select
                id="customerType"
                className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base text-slate-100"
                {...register('customerType')}
              >
                <option value="shipper">Shipper</option>
                <option value="consignee">Consignee</option>
                <option value="broker">Broker</option>
                <option value="direct">Direct</option>
              </select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base text-slate-100"
                {...register('status')}
              >
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="credit_hold">Credit hold</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" maxLength={3} {...register('currency')} />
            </div>
            <div>
              <Label htmlFor="creditLimit">Credit limit</Label>
              <Input id="creditLimit" type="number" inputMode="decimal" {...register('creditLimit')} />
            </div>
            <div>
              <Label htmlFor="paymentTermsDays">Payment terms (days)</Label>
              <Input id="paymentTermsDays" type="number" inputMode="numeric" {...register('paymentTermsDays')} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Primary contact</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="contactName">Name</Label>
              <Input id="contactName" autoComplete="name" {...register('contactName')} />
              {errors.contactName ? (
                <p className="mt-1 text-xs text-red-400">{errors.contactName.message}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="contactEmail">Email</Label>
              <Input id="contactEmail" type="email" autoComplete="email" {...register('contactEmail')} />
              {errors.contactEmail ? (
                <p className="mt-1 text-xs text-red-400">{errors.contactEmail.message}</p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input id="contactPhone" type="tel" autoComplete="tel" {...register('contactPhone')} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Billing address</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="line1">Address line</Label>
              <Input id="line1" autoComplete="street-address" {...register('line1')} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" autoComplete="address-level2" {...register('city')} />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal code</Label>
              <Input id="postalCode" autoComplete="postal-code" {...register('postalCode')} />
            </div>
            <div>
              <Label htmlFor="countryCode">Country (ISO)</Label>
              <Input id="countryCode" maxLength={2} {...register('countryCode')} />
            </div>
          </div>
        </section>

        {mutation.isError ? (
          <p className="text-sm text-red-400">Could not save customer. Try again.</p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            to="/customers"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-700 px-4 text-sm font-medium text-slate-200"
          >
            Cancel
          </Link>
          <Button type="submit" className="min-h-11" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save customer'}
          </Button>
        </div>
      </form>
    </div>
  )
}

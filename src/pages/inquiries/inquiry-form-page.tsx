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
import { useCustomers } from '@/hooks/use-customers'
import { inquiryKeys } from '@/hooks/use-inquiries'
import { createInquiry } from '@/repositories/inquiry-repository'

const schema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  transportMode: z.enum(['air', 'sea', 'road', 'rail', 'courier']),
  direction: z.enum(['import', 'export', 'domestic']),
  originCode: z.string().min(3),
  originName: z.string().min(2),
  originCountry: z.string().length(2),
  destinationCode: z.string().min(3),
  destinationName: z.string().min(2),
  destinationCountry: z.string().length(2),
  cargoSummary: z.string().min(5),
  requestedPickupDate: z.string().optional(),
  requestedDeliveryDate: z.string().optional(),
  specialInstructions: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function InquiryFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: customers = [] } = useCustomers()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      transportMode: 'air',
      direction: 'export',
      originCountry: 'GB',
      destinationCountry: 'US',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!user) throw new Error('Not signed in')
      return createInquiry(user.id, {
        customerId: values.customerId,
        transportMode: values.transportMode,
        direction: values.direction,
        origin: {
          code: values.originCode.toUpperCase(),
          name: values.originName,
          countryCode: values.originCountry.toUpperCase(),
        },
        destination: {
          code: values.destinationCode.toUpperCase(),
          name: values.destinationName,
          countryCode: values.destinationCountry.toUpperCase(),
        },
        cargoSummary: values.cargoSummary,
        requestedPickupDate: values.requestedPickupDate || null,
        requestedDeliveryDate: values.requestedDeliveryDate || null,
        specialInstructions: values.specialInstructions || null,
        assignedSalesUserId: user.id,
      })
    },
    onSuccess: (inquiry) => {
      void queryClient.invalidateQueries({ queryKey: inquiryKeys.all })
      navigate(`/inquiries/${inquiry.id}`)
    },
  })

  return (
    <div>
      <PageHeader
        title="New inquiry"
        description="Start the commercial workflow. Extensible to sea, road, and rail later."
      />
      <form className="space-y-6" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div>
            <Label htmlFor="customerId">Customer</Label>
            <select
              id="customerId"
              className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base"
              {...register('customerId')}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legalName}
                </option>
              ))}
            </select>
            {errors.customerId ? (
              <p className="mt-1 text-xs text-red-400">{errors.customerId.message}</p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="transportMode">Mode</Label>
              <select
                id="transportMode"
                className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base"
                {...register('transportMode')}
              >
                <option value="air">Air</option>
                <option value="sea">Sea</option>
                <option value="road">Road</option>
                <option value="rail">Rail</option>
                <option value="courier">Courier</option>
              </select>
            </div>
            <div>
              <Label htmlFor="direction">Direction</Label>
              <select
                id="direction"
                className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base"
                {...register('direction')}
              >
                <option value="export">Export</option>
                <option value="import">Import</option>
                <option value="domestic">Domestic</option>
              </select>
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:grid-cols-2">
          <h3 className="sm:col-span-2 text-sm font-semibold text-slate-200">Lane</h3>
          <div>
            <Label htmlFor="originCode">Origin code</Label>
            <Input id="originCode" placeholder="LHR" {...register('originCode')} />
          </div>
          <div>
            <Label htmlFor="originName">Origin name</Label>
            <Input id="originName" {...register('originName')} />
          </div>
          <div>
            <Label htmlFor="destinationCode">Destination code</Label>
            <Input id="destinationCode" placeholder="JFK" {...register('destinationCode')} />
          </div>
          <div>
            <Label htmlFor="destinationName">Destination name</Label>
            <Input id="destinationName" {...register('destinationName')} />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div>
            <Label htmlFor="cargoSummary">Cargo summary</Label>
            <textarea
              id="cargoSummary"
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-base text-slate-100"
              {...register('cargoSummary')}
            />
            {errors.cargoSummary ? (
              <p className="mt-1 text-xs text-red-400">{errors.cargoSummary.message}</p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="requestedPickupDate">Requested pickup</Label>
              <Input id="requestedPickupDate" type="date" {...register('requestedPickupDate')} />
            </div>
            <div>
              <Label htmlFor="requestedDeliveryDate">Requested delivery</Label>
              <Input id="requestedDeliveryDate" type="date" {...register('requestedDeliveryDate')} />
            </div>
          </div>
          <div>
            <Label htmlFor="specialInstructions">Special instructions</Label>
            <Input id="specialInstructions" {...register('specialInstructions')} />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            to="/inquiries"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-700 px-4 text-sm font-medium"
          >
            Cancel
          </Link>
          <Button type="submit" className="min-h-11" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create inquiry'}
          </Button>
        </div>
      </form>
    </div>
  )
}

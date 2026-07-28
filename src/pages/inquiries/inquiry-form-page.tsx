import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, UserPlus } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { FormActions } from '@/components/layout/form-actions'
import { PageHeader } from '@/components/layout/page-header'
import { Button, buttonClasses } from '@/components/ui/button'
import { Field, FormSection, Input, Select, Textarea } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { findLocation, LANE_TEMPLATES } from '@/domain/locations'
import { useAuth } from '@/features/auth/auth-context'
import { useActivation } from '@/hooks/use-activation'
import { useCustomers } from '@/hooks/use-customers'
import { inquiryKeys } from '@/hooks/use-inquiries'
import { createInquiry } from '@/repositories/inquiry-repository'
import { outboxKey } from '@/hooks/use-outbox'

const schema = z.object({
  customerId: z.string().min(1, 'Choose a customer'),
  transportMode: z.enum(['air', 'sea', 'road', 'rail', 'courier']),
  direction: z.enum(['import', 'export', 'domestic']),
  originCode: z.string().min(3, 'Use a 3-letter code').max(3),
  destinationCode: z.string().min(3, 'Use a 3-letter code').max(3),
  cargoSummary: z.string().min(4, 'Describe the cargo briefly'),
  requestedPickupDate: z.string().optional(),
  specialInstructions: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function InquiryFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const { markStep } = useActivation()
  const { data: customers = [] } = useCustomers()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      transportMode: 'air',
      direction: 'export',
      originCode: '',
      destinationCode: '',
      cargoSummary: '',
    },
  })

  // Smart default: with a single customer there is nothing to choose.
  useEffect(() => {
    if (customers.length === 1) {
      setValue('customerId', customers[0].id)
    }
  }, [customers, setValue])

  const originCode = watch('originCode')
  const destinationCode = watch('destinationCode')
  const originMatch = findLocation(originCode ?? '')
  const destinationMatch = findLocation(destinationCode ?? '')

  const applyTemplate = (templateId: string) => {
    const template = LANE_TEMPLATES.find((item) => item.id === templateId)
    if (!template) return
    setValue('originCode', template.origin, { shouldValidate: true })
    setValue('destinationCode', template.destination, { shouldValidate: true })
    setValue('direction', template.direction)
    setValue('cargoSummary', template.cargoSummary, { shouldValidate: true })
  }

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!user) throw new Error('Not signed in')
      const origin = findLocation(values.originCode) ?? {
        code: values.originCode.toUpperCase(),
        name: values.originCode.toUpperCase(),
        countryCode: 'XX',
      }
      const destination = findLocation(values.destinationCode) ?? {
        code: values.destinationCode.toUpperCase(),
        name: values.destinationCode.toUpperCase(),
        countryCode: 'XX',
      }

      return createInquiry(user.id, {
        customerId: values.customerId,
        transportMode: values.transportMode,
        direction: values.direction,
        origin,
        destination,
        cargoSummary: values.cargoSummary,
        requestedPickupDate: values.requestedPickupDate || null,
        requestedDeliveryDate: null,
        specialInstructions: values.specialInstructions || null,
        assignedSalesUserId: user.id,
      })
    },
    onSuccess: async (inquiry) => {
      await markStep('created_inquiry')
      if (!navigator.onLine) await markStep('worked_offline')
      await queryClient.invalidateQueries({ queryKey: inquiryKeys.all })
      await queryClient.invalidateQueries({ queryKey: outboxKey })
      notify({
        tone: 'success',
        message: `${inquiry.inquiryNumber} created`,
        description: navigator.onLine ? 'Queued for sync' : 'Saved offline on this device',
      })
      navigate(`/inquiries/${inquiry.id}`, { replace: true })
    },
    onError: () => notify({ tone: 'error', message: 'Could not save the inquiry' }),
  })

  if (customers.length === 0) {
    return (
      <div>
        <PageHeader title="New inquiry" backTo="/inquiries" backLabel="Inquiries" />
        <div className="rounded-card border border-dashed border-line-strong bg-surface p-6 text-center">
          <p className="text-sm font-medium text-ink">Add a customer first</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            An inquiry belongs to a customer. Creating one takes about fifteen seconds.
          </p>
          <Link to="/customers/new" className={buttonClasses('primary', 'md', 'mt-4')}>
            <UserPlus className="size-4" aria-hidden />
            Add customer
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="New inquiry"
        description="Three fields and a lane are enough — refine later."
        backTo="/inquiries"
        backLabel="Inquiries"
      />

      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
            <Sparkles className="size-3.5 text-brand" aria-hidden />
            Start from a common lane
          </p>
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {LANE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template.id)}
                className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand hover:text-brand"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <FormSection title="Lane" description="Type an IATA code — we recognise common airports.">
          <Field
            label="Customer"
            htmlFor="customerId"
            error={errors.customerId?.message}
            className="sm:col-span-2"
          >
            <Select id="customerId" {...register('customerId')} autoFocus>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.legalName}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Origin"
            htmlFor="originCode"
            error={errors.originCode?.message}
            hint={originMatch ? `${originMatch.name}, ${originMatch.countryCode}` : 'e.g. LHR'}
          >
            <Input
              id="originCode"
              maxLength={3}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="LHR"
              className="uppercase"
              {...register('originCode')}
            />
          </Field>

          <Field
            label="Destination"
            htmlFor="destinationCode"
            error={errors.destinationCode?.message}
            hint={
              destinationMatch
                ? `${destinationMatch.name}, ${destinationMatch.countryCode}`
                : 'e.g. JFK'
            }
          >
            <Input
              id="destinationCode"
              maxLength={3}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="JFK"
              className="uppercase"
              {...register('destinationCode')}
            />
          </Field>

          <Field label="Mode" htmlFor="transportMode">
            <Select id="transportMode" {...register('transportMode')}>
              <option value="air">Air</option>
              <option value="sea">Sea</option>
              <option value="road">Road</option>
              <option value="rail">Rail</option>
              <option value="courier">Courier</option>
            </Select>
          </Field>

          <Field label="Direction" htmlFor="direction">
            <Select id="direction" {...register('direction')}>
              <option value="export">Export</option>
              <option value="import">Import</option>
              <option value="domestic">Domestic</option>
            </Select>
          </Field>
        </FormSection>

        <FormSection title="Cargo" description="A short description is enough to start pricing.">
          <Field
            label="Cargo summary"
            htmlFor="cargoSummary"
            error={errors.cargoSummary?.message}
            className="sm:col-span-2"
          >
            <Textarea
              id="cargoSummary"
              rows={3}
              placeholder="4 pallets, 900 kg, stackable, non-DG"
              {...register('cargoSummary')}
            />
          </Field>

          <Field label="Requested pickup" htmlFor="requestedPickupDate" optional>
            <Input id="requestedPickupDate" type="date" {...register('requestedPickupDate')} />
          </Field>

          <Field label="Special instructions" htmlFor="specialInstructions" optional>
            <Input
              id="specialInstructions"
              placeholder="Temperature, DG, deadlines"
              {...register('specialInstructions')}
            />
          </Field>
        </FormSection>

        <FormActions>
          <Link to="/inquiries" className={buttonClasses('secondary', 'md')}>
            Cancel
          </Link>
          <Button type="submit" loading={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Create inquiry'}
          </Button>
        </FormActions>
      </form>
    </div>
  )
}

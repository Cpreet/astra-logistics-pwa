import { z } from 'zod'
import { CUSTOMER_STATUSES, CUSTOMER_TYPES } from '@/types/customer'
import { INQUIRY_STATUSES, TRADE_DIRECTIONS, TRANSPORT_MODES } from '@/types/inquiry'
import { SYNC_STATUSES } from '@/types/base'

/**
 * Persistence schemas — the repository's own guard.
 *
 * Forms validate their input, but a form bug must not be able to corrupt the
 * database (`spec.md` §7), so every write re-validates here. These describe the
 * *stored* shape, which is not always the same as the form shape: forms collect
 * a contact alongside a customer, the repository stores them separately.
 */

const isoDate = z.string().datetime({ offset: true }).or(z.string().min(1))

const baseEntitySchema = z.object({
  id: z.string().min(1),
  createdAt: isoDate,
  updatedAt: isoDate,
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1),
  version: z.number().int().positive(),
  syncStatus: z.enum(SYNC_STATUSES),
  deletedAt: isoDate.nullish(),
})

const addressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string().optional(),
  postalCode: z.string(),
  countryCode: z.string().length(2),
})

const customerSchema = baseEntitySchema.extend({
  customerCode: z.string().min(1),
  legalName: z.string().min(1),
  tradingName: z.string().nullish(),
  customerType: z.enum(CUSTOMER_TYPES),
  taxIdentifier: z.string().nullish(),
  registrationNumber: z.string().nullish(),
  creditLimit: z.number().min(0),
  paymentTermsDays: z.number().int().min(0),
  currency: z.string().length(3),
  status: z.enum(CUSTOMER_STATUSES),
  primaryContactId: z.string().nullish(),
  billingAddress: addressSchema,
  shippingAddresses: z.array(addressSchema),
  complianceStatus: z.enum(['clear', 'review', 'hold']),
  notes: z.string().nullish(),
})

const customerContactSchema = baseEntitySchema.extend({
  customerId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullish(),
  jobTitle: z.string().nullish(),
  isPrimary: z.boolean(),
})

const locationRefSchema = z.object({
  code: z.string().min(1),
  name: z.string(),
  countryCode: z.string(),
})

const inquirySchema = baseEntitySchema.extend({
  inquiryNumber: z.string().min(1),
  customerId: z.string().min(1),
  transportMode: z.enum(TRANSPORT_MODES),
  direction: z.enum(TRADE_DIRECTIONS),
  origin: locationRefSchema,
  destination: locationRefSchema,
  cargoSummary: z.string().min(1),
  requestedPickupDate: z.string().nullish(),
  requestedDeliveryDate: z.string().nullish(),
  specialInstructions: z.string().nullish(),
  assignedSalesUserId: z.string().min(1),
  status: z.enum(INQUIRY_STATUSES),
})

/**
 * Registry keyed by the `entityType` passed to the persist helpers. Entity
 * types without a schema yet are written unvalidated — add the schema when the
 * aggregate lands rather than blocking on a full set.
 */
export const ENTITY_SCHEMAS: Record<string, z.ZodTypeAny> = {
  customer: customerSchema,
  customer_contact: customerContactSchema,
  inquiry: inquirySchema,
}

export class EntityValidationError extends Error {
  readonly code = 'E_VALIDATION'
  readonly entityType: string
  readonly issues: string[]

  constructor(entityType: string, issues: string[]) {
    super(`${entityType} failed validation: ${issues.join('; ')}`)
    this.name = 'EntityValidationError'
    this.entityType = entityType
    this.issues = issues
  }
}

/**
 * Throws `EntityValidationError` when the entity does not match its stored
 * shape. Unknown entity types pass through so new aggregates can land before
 * their schema is written.
 */
export function validateEntity(entityType: string, entity: unknown): void {
  const schema = ENTITY_SCHEMAS[entityType]
  if (!schema) return

  const result = schema.safeParse(entity)
  if (result.success) return

  const issues = result.error.issues.map(
    (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
  )
  throw new EntityValidationError(entityType, issues)
}

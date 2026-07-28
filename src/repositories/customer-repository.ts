import { db } from '@/db/astra-db'
import type { Customer, CustomerContact } from '@/types/customer'
import { persistCreate, persistUpdate } from '@/repositories/persist-entity'
import { createBaseEntity, touchEntity } from '@/utils/entity'
import { createId } from '@/utils/id'

export async function listCustomers(): Promise<Customer[]> {
  const rows = await db.customers.filter((c) => !c.deletedAt).toArray()
  return rows.sort((a, b) => a.legalName.localeCompare(b.legalName))
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const customer = await db.customers.get(id)
  if (!customer || customer.deletedAt) return undefined
  return customer
}

export async function countCustomersByStatus(): Promise<Record<string, number>> {
  const customers = await listCustomers()
  return customers.reduce<Record<string, number>>((acc, customer) => {
    acc[customer.status] = (acc[customer.status] ?? 0) + 1
    return acc
  }, {})
}

export type CreateCustomerInput = Omit<
  Customer,
  keyof ReturnType<typeof createBaseEntity> | 'customerCode' | 'primaryContactId'
> & {
  contactName: string
  contactEmail: string
  contactPhone?: string
}

async function nextCustomerCode(): Promise<string> {
  const count = await db.customers.count()
  return `CUS-${String(count + 1).padStart(5, '0')}`
}

export async function createCustomer(
  userId: string,
  input: CreateCustomerInput,
): Promise<{ customer: Customer; contact: CustomerContact }> {
  const base = createBaseEntity(userId)
  const contactBase = createBaseEntity(userId)
  const customerCode = await nextCustomerCode()

  const contact: CustomerContact = {
    ...contactBase,
    customerId: base.id,
    name: input.contactName,
    email: input.contactEmail.toLowerCase(),
    phone: input.contactPhone ?? null,
    jobTitle: null,
    isPrimary: true,
  }

  const customer: Customer = {
    ...base,
    customerCode,
    legalName: input.legalName,
    tradingName: input.tradingName ?? null,
    customerType: input.customerType,
    taxIdentifier: input.taxIdentifier ?? null,
    registrationNumber: input.registrationNumber ?? null,
    creditLimit: input.creditLimit,
    paymentTermsDays: input.paymentTermsDays,
    currency: input.currency,
    status: input.status,
    primaryContactId: contact.id,
    billingAddress: input.billingAddress,
    shippingAddresses: input.shippingAddresses,
    complianceStatus: input.complianceStatus,
    notes: input.notes ?? null,
  }

  contact.customerId = customer.id

  await persistCreate(db.customers, 'customer', customer, {
    userId,
    summary: `Customer ${customer.customerCode} created`,
  })
  await persistCreate(db.customerContacts, 'customer_contact', contact, {
    userId,
    summary: `Primary contact added for ${customer.customerCode}`,
  })

  return { customer, contact }
}

export async function updateCustomerStatus(
  userId: string,
  customerId: string,
  status: Customer['status'],
): Promise<Customer> {
  const existing = await getCustomerById(customerId)
  if (!existing) {
    throw new Error('Customer not found')
  }
  const updated = touchEntity({ ...existing, status }, userId)
  return persistUpdate(db.customers, 'customer', updated, {
    userId,
    summary: `Customer ${existing.customerCode} status → ${status}`,
    metadata: { status },
  })
}

export async function listContactsForCustomer(customerId: string): Promise<CustomerContact[]> {
  return db.customerContacts
    .filter((c) => c.customerId === customerId && !c.deletedAt)
    .toArray()
}

export function buildEmptyAddress(): Customer['billingAddress'] {
  return {
    line1: '',
    city: '',
    postalCode: '',
    countryCode: 'US',
  }
}

export function newCustomerDraftId(): string {
  return createId()
}

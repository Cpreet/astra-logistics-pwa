import type { BaseEntity } from '@/types/base'

export const CUSTOMER_STATUSES = ['lead', 'active', 'credit_hold', 'inactive'] as const
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

export const CUSTOMER_TYPES = ['shipper', 'consignee', 'broker', 'direct'] as const
export type CustomerType = (typeof CUSTOMER_TYPES)[number]

export interface Address {
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  countryCode: string
}

export interface Customer extends BaseEntity {
  customerCode: string
  legalName: string
  tradingName?: string | null
  customerType: CustomerType
  taxIdentifier?: string | null
  registrationNumber?: string | null
  creditLimit: number
  paymentTermsDays: number
  currency: string
  status: CustomerStatus
  primaryContactId?: string | null
  billingAddress: Address
  shippingAddresses: Address[]
  complianceStatus: 'clear' | 'review' | 'hold'
  notes?: string | null
}

export interface CustomerContact extends BaseEntity {
  customerId: string
  name: string
  email: string
  phone?: string | null
  jobTitle?: string | null
  isPrimary: boolean
}

import type { BaseEntity } from '@/types/base'

export interface Charge extends BaseEntity {
  shipmentId: string
  quotationId?: string | null
  consolidationId?: string | null
  chargeCode: string
  description: string
  chargeType: 'buy' | 'sell' | 'both'
  category: string
  vendorId?: string | null
  quantityScaled: number
  quantityScale: number
  unit: string
  currency: string
  exchangeRateScaled: number
  exchangeRateScale: number
  buyRateMinor?: number | null
  sellRateMinor?: number | null
  taxRateBps: number
  buyAmountMinor: number
  sellAmountMinor: number
  taxAmountMinor: number
  marginAmountMinor: number
  costBasis: 'estimated' | 'accrued' | 'actual'
  isDisbursement: boolean
  vendorInvoiceId?: string | null
  customerInvoiceId?: string | null
  approved: boolean
  source: 'quotation' | 'rate_card' | 'manual' | 'allocation' | 'system'
}

export interface InvoiceLine {
  chargeId?: string | null
  description: string
  quantityScaled: number
  quantityScale: number
  unitPriceMinor: number
  taxAmountMinor: number
  lineTotalMinor: number
  isDisbursement: boolean
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string
  shipmentId: string
  customerId: string
  vendorId?: string | null
  invoiceType: 'customer' | 'vendor' | 'credit_note'
  relatedInvoiceId?: string | null
  currency: string
  subtotalMinor: number
  taxTotalMinor: number
  disbursementTotalMinor: number
  totalMinor: number
  paidAmountMinor: number
  balanceAmountMinor: number
  issueDate: string
  dueDate: string
  status:
    | 'draft'
    | 'approved'
    | 'issued'
    | 'partially_paid'
    | 'paid'
    | 'overdue'
    | 'disputed'
    | 'void'
  lineItems: InvoiceLine[]
  notes?: string | null
}

export interface Payment extends BaseEntity {
  paymentNumber: string
  invoiceId: string
  customerId?: string | null
  vendorId?: string | null
  paymentType: 'receivable' | 'payable' | 'refund'
  amountMinor: number
  currency: string
  paymentDate: string
  paymentMethod: string
  transactionReference?: string | null
  status: 'pending' | 'completed' | 'failed' | 'reversed'
  notes?: string | null
}

/** Editable shipping document models for printable label / AWB / invoice UIs. */

export interface PartyBlock {
  id?: string
  name: string
  company: string
  phone: string
  addressLines: string[]
  city?: string
  postalCode?: string
  state?: string
  country: string
  countryCode: string
  taxId?: string
  accountNo?: string
  reference?: string
  contact?: string
}

export interface ShippingLabelDoc {
  template: 'courier_label'
  carrierName: string
  carrierTagline: string
  partnerName: string
  printedAt: string
  pageLabel: string
  shipFrom: PartyBlock
  shipTo: PartyBlock
  weightKg: string
  dimensionalWeightKg: string
  shipDate: string
  dimensions: string
  trackingNumber: string
  billing: string
  description: string
  reference: string
}

export type PaymentType = 'account' | 'cash' | 'collect'
export type ServiceType = 'airport_to_airport' | 'airport_to_door' | 'pickup'

export interface AirWaybillDoc {
  template: 'air_waybill'
  carrierName: string
  motherNumber: string
  shipper: PartyBlock
  consignee: PartyBlock
  paymentType: PaymentType
  pieces: string
  actualWeightKg: string
  chargeableWeightKg: string
  departureAirport: string
  destinationAirport: string
  serviceType: ServiceType
  declaredValue: string
  declaredCurrency: string
  insuranceAmount: string
  codAmount: string
  specialInstructions: string
  shipperVat: string
  receiverVat: string
  hsCode: string
  descriptionOfGoods: string
  dimensions: string
  volumetricWeightKg: string
  currency: string
  surcharges: string
  total: string
  copyLabel: string
  shipperDate: string
}

export type IgstPaymentStatus = 'not_applicable' | 'lut_bond' | 'against_igst'

export interface GstInvoiceLine {
  serial: number
  description: string
  hsnCode: string
  quantity: string
  rate: string
  totalValue: string
  igstRate: string
  valueInr: string
}

export interface GstInvoiceDoc {
  template: 'gst_invoice'
  shipperName: string
  shipperAddress: string
  shipperPhone: string
  shipperTaxIds: string
  igstPaymentStatus: IgstPaymentStatus
  invoiceNumber: string
  invoiceDate: string
  placeOfSupply: string
  stateName: string
  consigneeAttention: string
  consigneeName: string
  consigneeAddress: string
  consigneeCountry: string
  gstin: string
  vehicleNumber: string
  dateOfSupply: string
  stateCode: string
  lines: GstInvoiceLine[]
  amountInWords: string
  totalBeforeTax: string
  igstInInr: string
  grandTotal: string
  declaration: string
  authorisedSignatoryLabel: string
}

export type ShippingDocument = ShippingLabelDoc | AirWaybillDoc | GstInvoiceDoc

export type ShippingDocumentKind = ShippingDocument['template']

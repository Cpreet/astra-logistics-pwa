import type {
  AirWaybillDoc,
  GstInvoiceDoc,
  ShippingDocumentKind,
  ShippingLabelDoc,
} from '@/types/shipping-document'

/** Sample payload modelled on a courier label (SHIP FROM / SHIP TO + tracking). */
export function createSampleCourierLabel(): ShippingLabelDoc {
  return {
    template: 'courier_label',
    carrierName: 'UBX',
    carrierTagline: 'UNITED BUSINESS XPRESS',
    partnerName: 'iMORNING GLOBAL',
    printedAt: '08/7/2026 12:09:04',
    pageLabel: '1/1',
    shipFrom: {
      id: '10621',
      name: 'Anna Wu',
      company: 'AURELIA ASIA',
      phone: '852-35902338',
      addressLines: [
        'UNIT 04,7/F BRIGHT WAY TOWER',
        'NO.33 MONG KOK ROAD,KOWLOON',
        'HONG KONG, HONG KONG',
      ],
      country: 'Hong Kong',
      countryCode: 'HK',
    },
    shipTo: {
      name: 'Vijaya Kumar',
      company: 'Indian Terrain Fashions Limited',
      phone: '91-8754580666',
      addressLines: [
        'Survey No.549/2&232, Plot No 4,',
        'Thirukkachiyur & Sengundram Industrial Area',
        'Singaperumal Koil Post Chengalpet-603204',
        'Tamil Nadu, India',
      ],
      country: 'India',
      countryCode: 'IN',
    },
    weightKg: '10.90000',
    dimensionalWeightKg: '',
    shipDate: '07/07/2026',
    dimensions: '51, 33, 25',
    trackingNumber: 'HKIN060929614',
    billing: '',
    description: 'NylonElasticTape[]',
    reference: 'C 070706',
  }
}

/** Sample payload modelled on a Linex-style air waybill. */
export function createSampleAirWaybill(): AirWaybillDoc {
  return {
    template: 'air_waybill',
    carrierName: 'Linex Linehaul Express',
    motherNumber: '595135790',
    shipper: {
      accountNo: 'A0053',
      reference: 'MAAP00001969',
      name: 'JIANGSU LIANFA TEXTILE CO., LTD',
      company: 'JIANGSU LIANFA TEXTILE CO., LTD',
      phone: '86-13584709108',
      contact: 'EMMA',
      addressLines: [
        '88 HENGLIAN ROAD, HAAN',
        'NANTONG, JIANGSU PROVINCE',
        'CHINA 226600',
      ],
      country: 'China',
      countryCode: 'CN',
    },
    consignee: {
      name: 'Indian Terrain Fashions Limited',
      company: 'Indian Terrain Fashions Limited',
      phone: '91-8754580666',
      contact: 'Vijaya Kumar',
      addressLines: [
        'Survey No.549/2&232, Plot No 4,',
        'Thirukkachiyur & Sengundram Industrial Area',
        'Singaperumal Koil Post',
      ],
      city: 'Chengalpet',
      postalCode: '603204',
      state: 'Tamil Nadu',
      country: 'India',
      countryCode: 'IN',
    },
    paymentType: 'account',
    pieces: '1',
    actualWeightKg: '0.200',
    chargeableWeightKg: '0.200',
    departureAirport: 'HKG',
    destinationAirport: 'MAA',
    serviceType: 'airport_to_door',
    declaredValue: '1.00',
    declaredCurrency: 'USD',
    insuranceAmount: '',
    codAmount: '',
    specialInstructions: 'SF# 1568434619407',
    shipperVat: '',
    receiverVat: '33AACC1509D1Z9',
    hsCode: '52081130',
    descriptionOfGoods: '100% cotton fabric',
    dimensions: '',
    volumetricWeightKg: '',
    currency: 'USD',
    surcharges: '',
    total: '1.00',
    copyLabel: 'DESTINATION COPY',
    shipperDate: '07/07/2026',
  }
}

/** Sample payload modelled on an Indian GST commercial invoice. */
export function createSampleGstInvoice(): GstInvoiceDoc {
  return {
    template: 'gst_invoice',
    shipperName: 'INDIAN TERRAIN FASHIONS LTD.',
    shipperAddress:
      'survey no.549/2&232, plot no 4, thirukkachiyur & sengundram industrial area, singaperumal koil post chengalpet-603204.',
    shipperPhone: '044 4343 2180',
    shipperTaxIds: '',
    igstPaymentStatus: 'lut_bond',
    invoiceNumber: 'S/17/26-27',
    invoiceDate: '11/07/2026',
    placeOfSupply: '',
    stateName: 'TAMIL NADU',
    consigneeAttention: 'MR.KATHY',
    consigneeName: 'JIANGSU LIANFA TEXTILE CO. LTD',
    consigneeAddress:
      '88 HENGLIAN ROAD, HAAN, NANTONG, JIANGSU PROVINCE, CHINA 226600 TEL: 86-13584709108',
    consigneeCountry: 'CHINA',
    gstin: '33AACC1509D1Z9',
    vehicleNumber: '',
    dateOfSupply: '',
    stateCode: '33',
    lines: [
      {
        serial: 1,
        description: 'FABRIC SWATCH',
        hsnCode: '52081130',
        quantity: '1',
        rate: '1.00',
        totalValue: '1.00',
        igstRate: '',
        valueInr: '',
      },
    ],
    amountInWords: 'USD ONE DOLLAR ONLY',
    totalBeforeTax: '1.00',
    igstInInr: '',
    grandTotal: '1.00',
    declaration:
      "Please declare if your 'supply meant for export is under Bond / LUT' or 'is the supply meant for export against payment of IGST'.",
    authorisedSignatoryLabel: 'Authorised signatory',
  }
}

export function createSampleDocument(kind: ShippingDocumentKind) {
  switch (kind) {
    case 'courier_label':
      return createSampleCourierLabel()
    case 'air_waybill':
      return createSampleAirWaybill()
    case 'gst_invoice':
      return createSampleGstInvoice()
  }
}

export const DOCUMENT_KIND_OPTIONS: Array<{
  value: ShippingDocumentKind
  label: string
  description: string
}> = [
  {
    value: 'courier_label',
    label: 'Courier label',
    description: 'SHIP FROM / SHIP TO with barcode and tracking number',
  },
  {
    value: 'air_waybill',
    label: 'Air waybill',
    description: 'Dense grid AWB with service type and chargeable weight',
  },
  {
    value: 'gst_invoice',
    label: 'GST invoice',
    description: 'Export commercial invoice with HSN lines and IGST status',
  },
]

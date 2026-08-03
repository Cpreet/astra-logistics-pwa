import { describe, expect, it } from 'vitest'
import { barcodeBars } from '@/domain/shipping-documents/barcode'
import {
  createSampleAirWaybill,
  createSampleCourierLabel,
  createSampleDocument,
  createSampleGstInvoice,
} from '@/domain/shipping-documents/samples'

describe('shipping document samples', () => {
  it('builds a courier label with tracking and parties', () => {
    const label = createSampleCourierLabel()
    expect(label.template).toBe('courier_label')
    expect(label.trackingNumber).toMatch(/^HKIN/)
    expect(label.shipFrom.company).toBeTruthy()
    expect(label.shipTo.countryCode).toBe('IN')
  })

  it('builds an air waybill with airports and service type', () => {
    const awb = createSampleAirWaybill()
    expect(awb.departureAirport).toBe('HKG')
    expect(awb.destinationAirport).toBe('MAA')
    expect(awb.serviceType).toBe('airport_to_door')
  })

  it('builds a GST invoice with HSN line items', () => {
    const invoice = createSampleGstInvoice()
    expect(invoice.invoiceNumber).toBe('S/17/26-27')
    expect(invoice.lines[0]?.hsnCode).toBe('52081130')
    expect(invoice.igstPaymentStatus).toBe('lut_bond')
  })

  it('returns the matching sample for each kind', () => {
    expect(createSampleDocument('courier_label').template).toBe('courier_label')
    expect(createSampleDocument('air_waybill').template).toBe('air_waybill')
    expect(createSampleDocument('gst_invoice').template).toBe('gst_invoice')
  })
})

describe('barcode bars', () => {
  it('emits bars for an alphanumeric tracking number', () => {
    const bars = barcodeBars('HKIN060929614')
    expect(bars.length).toBeGreaterThan(10)
    expect(bars[0]!.width).toBeGreaterThan(0)
  })
})

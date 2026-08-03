import { Printer, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import {
  DOCUMENT_KIND_OPTIONS,
  createSampleDocument,
} from '@/domain/shipping-documents/samples'
import { AirWaybillTemplate } from '@/features/shipping-documents/air-waybill-template'
import { CourierLabelTemplate } from '@/features/shipping-documents/courier-label-template'
import { GstInvoiceTemplate } from '@/features/shipping-documents/gst-invoice-template'
import type {
  AirWaybillDoc,
  GstInvoiceDoc,
  ShippingDocument,
  ShippingDocumentKind,
  ShippingLabelDoc,
} from '@/types/shipping-document'

function setPath<T extends object>(object: T, path: string, value: string): T {
  const clone = structuredClone(object) as Record<string, unknown>
  const parts = path.split('.')
  let cursor: Record<string, unknown> = clone

  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]!
    const next = cursor[key]
    if (Array.isArray(next)) {
      const index = Number(parts[i + 1])
      if (!Number.isInteger(index)) return object
      const copy = [...next]
      const item = copy[index]
      if (typeof item !== 'object' || item === null) return object
      copy[index] = { ...(item as Record<string, unknown>) }
      cursor[key] = copy
      cursor = copy[index] as Record<string, unknown>
      i += 1
      continue
    }
    if (typeof next !== 'object' || next === null) return object
    cursor[key] = { ...(next as Record<string, unknown>) }
    cursor = cursor[key] as Record<string, unknown>
  }

  const last = parts[parts.length - 1]!
  if (last === 'addressLines') {
    cursor[last] = value.split('\n')
  } else {
    cursor[last] = value
  }
  return clone as T
}

export function DocumentsPage() {
  const [kind, setKind] = useState<ShippingDocumentKind>('courier_label')
  const [docs, setDocs] = useState<Record<ShippingDocumentKind, ShippingDocument>>(() => ({
    courier_label: createSampleDocument('courier_label'),
    air_waybill: createSampleDocument('air_waybill'),
    gst_invoice: createSampleDocument('gst_invoice'),
  }))

  const doc = docs[kind]

  const update = (path: string, value: string) => {
    setDocs((previous) => ({
      ...previous,
      [kind]: setPath(previous[kind], path, value),
    }))
  }

  const reset = () => {
    setDocs((previous) => ({
      ...previous,
      [kind]: createSampleDocument(kind),
    }))
  }

  const editor =
    doc.template === 'courier_label' ? (
      <CourierLabelEditor doc={doc} onChange={update} />
    ) : doc.template === 'air_waybill' ? (
      <AirWaybillEditor doc={doc} onChange={update} />
    ) : (
      <GstInvoiceEditor doc={doc} onChange={update} />
    )

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Documents"
        title="Labels, waybills & invoices"
        description="Editable print templates modelled on courier labels, air waybills, and GST commercial invoices. Change the fields and print."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={reset}>
              <RotateCcw className="size-4" aria-hidden />
              Reset sample
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden />
              Print / PDF
            </Button>
          </div>
        }
      />

      <div className="no-print">
        <Segmented
          label="Document template"
          value={kind}
          onChange={setKind}
          options={DOCUMENT_KIND_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
        <p className="mt-2 text-xs text-muted">
          {DOCUMENT_KIND_OPTIONS.find((option) => option.value === kind)?.description}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
        <Card className="no-print h-fit space-y-3 xl:sticky xl:top-20">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Edit fields</CardTitle>
            <Badge tone="warning">Demo layout</Badge>
          </div>
          <p className="text-xs text-muted">
            Updates apply to the preview immediately. Use Print / PDF for a paper-matched copy.
          </p>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">{editor}</div>
        </Card>

        <div className="print-root overflow-x-auto rounded-card border border-line bg-raised p-3 sm:p-5">
          {doc.template === 'courier_label' ? <CourierLabelTemplate doc={doc} /> : null}
          {doc.template === 'air_waybill' ? <AirWaybillTemplate doc={doc} /> : null}
          {doc.template === 'gst_invoice' ? <GstInvoiceTemplate doc={doc} /> : null}
        </div>
      </div>
    </div>
  )
}

function CourierLabelEditor({
  doc,
  onChange,
}: {
  doc: ShippingLabelDoc
  onChange: (path: string, value: string) => void
}) {
  return (
    <>
      <Field label="Carrier name" htmlFor="carrierName">
        <Input
          id="carrierName"
          value={doc.carrierName}
          onChange={(e) => onChange('carrierName', e.target.value)}
        />
      </Field>
      <Field label="Carrier tagline" htmlFor="carrierTagline">
        <Input
          id="carrierTagline"
          value={doc.carrierTagline}
          onChange={(e) => onChange('carrierTagline', e.target.value)}
        />
      </Field>
      <Field label="Tracking number" htmlFor="trackingNumber">
        <Input
          id="trackingNumber"
          value={doc.trackingNumber}
          onChange={(e) => onChange('trackingNumber', e.target.value)}
        />
      </Field>
      <Field label="Ship from — name" htmlFor="fromName">
        <Input
          id="fromName"
          value={doc.shipFrom.name}
          onChange={(e) => onChange('shipFrom.name', e.target.value)}
        />
      </Field>
      <Field label="Ship from — company" htmlFor="fromCompany">
        <Input
          id="fromCompany"
          value={doc.shipFrom.company}
          onChange={(e) => onChange('shipFrom.company', e.target.value)}
        />
      </Field>
      <Field label="Ship from — phone" htmlFor="fromPhone">
        <Input
          id="fromPhone"
          value={doc.shipFrom.phone}
          onChange={(e) => onChange('shipFrom.phone', e.target.value)}
        />
      </Field>
      <Field label="Ship from — address (one line per row)" htmlFor="fromAddress">
        <Textarea
          id="fromAddress"
          rows={3}
          value={doc.shipFrom.addressLines.join('\n')}
          onChange={(e) => onChange('shipFrom.addressLines', e.target.value)}
        />
      </Field>
      <Field label="Ship to — name" htmlFor="toName">
        <Input
          id="toName"
          value={doc.shipTo.name}
          onChange={(e) => onChange('shipTo.name', e.target.value)}
        />
      </Field>
      <Field label="Ship to — company" htmlFor="toCompany">
        <Input
          id="toCompany"
          value={doc.shipTo.company}
          onChange={(e) => onChange('shipTo.company', e.target.value)}
        />
      </Field>
      <Field label="Ship to — phone" htmlFor="toPhone">
        <Input
          id="toPhone"
          value={doc.shipTo.phone}
          onChange={(e) => onChange('shipTo.phone', e.target.value)}
        />
      </Field>
      <Field label="Ship to — country code" htmlFor="toCountry">
        <Input
          id="toCountry"
          value={doc.shipTo.countryCode}
          onChange={(e) => onChange('shipTo.countryCode', e.target.value.toUpperCase())}
        />
      </Field>
      <Field label="Ship to — address" htmlFor="toAddress">
        <Textarea
          id="toAddress"
          rows={3}
          value={doc.shipTo.addressLines.join('\n')}
          onChange={(e) => onChange('shipTo.addressLines', e.target.value)}
        />
      </Field>
      <Field label="Weight (kg)" htmlFor="weightKg">
        <Input
          id="weightKg"
          value={doc.weightKg}
          onChange={(e) => onChange('weightKg', e.target.value)}
        />
      </Field>
      <Field label="Dimensions" htmlFor="dimensions">
        <Input
          id="dimensions"
          value={doc.dimensions}
          onChange={(e) => onChange('dimensions', e.target.value)}
        />
      </Field>
      <Field label="Description" htmlFor="description">
        <Input
          id="description"
          value={doc.description}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </Field>
      <Field label="Reference" htmlFor="reference">
        <Input
          id="reference"
          value={doc.reference}
          onChange={(e) => onChange('reference', e.target.value)}
        />
      </Field>
    </>
  )
}

function AirWaybillEditor({
  doc,
  onChange,
}: {
  doc: AirWaybillDoc
  onChange: (path: string, value: string) => void
}) {
  return (
    <>
      <Field label="Carrier" htmlFor="awbCarrier">
        <Input
          id="awbCarrier"
          value={doc.carrierName}
          onChange={(e) => onChange('carrierName', e.target.value)}
        />
      </Field>
      <Field label="Mother / tracking no." htmlFor="motherNumber">
        <Input
          id="motherNumber"
          value={doc.motherNumber}
          onChange={(e) => onChange('motherNumber', e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Departure" htmlFor="dep">
          <Input
            id="dep"
            value={doc.departureAirport}
            onChange={(e) => onChange('departureAirport', e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Destination" htmlFor="dest">
          <Input
            id="dest"
            value={doc.destinationAirport}
            onChange={(e) => onChange('destinationAirport', e.target.value.toUpperCase())}
          />
        </Field>
      </div>
      <Field label="Shipper name" htmlFor="shipperName">
        <Input
          id="shipperName"
          value={doc.shipper.name}
          onChange={(e) => onChange('shipper.name', e.target.value)}
        />
      </Field>
      <Field label="Shipper address" htmlFor="shipperAddress">
        <Textarea
          id="shipperAddress"
          rows={3}
          value={doc.shipper.addressLines.join('\n')}
          onChange={(e) => onChange('shipper.addressLines', e.target.value)}
        />
      </Field>
      <Field label="Consignee name" htmlFor="consigneeName">
        <Input
          id="consigneeName"
          value={doc.consignee.name}
          onChange={(e) => onChange('consignee.name', e.target.value)}
        />
      </Field>
      <Field label="Consignee address" htmlFor="consigneeAddress">
        <Textarea
          id="consigneeAddress"
          rows={3}
          value={doc.consignee.addressLines.join('\n')}
          onChange={(e) => onChange('consignee.addressLines', e.target.value)}
        />
      </Field>
      <Field label="Service type" htmlFor="serviceType">
        <Select
          id="serviceType"
          value={doc.serviceType}
          onChange={(e) => onChange('serviceType', e.target.value)}
        >
          <option value="airport_to_airport">Airport to airport</option>
          <option value="airport_to_door">Airport to door</option>
          <option value="pickup">Pickup</option>
        </Select>
      </Field>
      <Field label="Payment type" htmlFor="paymentType">
        <Select
          id="paymentType"
          value={doc.paymentType}
          onChange={(e) => onChange('paymentType', e.target.value)}
        >
          <option value="account">A/C</option>
          <option value="cash">Cash</option>
          <option value="collect">Collect</option>
        </Select>
      </Field>
      <Field label="Description of goods" htmlFor="goods">
        <Textarea
          id="goods"
          rows={2}
          value={doc.descriptionOfGoods}
          onChange={(e) => onChange('descriptionOfGoods', e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Pieces" htmlFor="pieces">
          <Input
            id="pieces"
            value={doc.pieces}
            onChange={(e) => onChange('pieces', e.target.value)}
          />
        </Field>
        <Field label="Chargeable wt" htmlFor="cwt">
          <Input
            id="cwt"
            value={doc.chargeableWeightKg}
            onChange={(e) => onChange('chargeableWeightKg', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Special instructions" htmlFor="special">
        <Input
          id="special"
          value={doc.specialInstructions}
          onChange={(e) => onChange('specialInstructions', e.target.value)}
        />
      </Field>
    </>
  )
}

function GstInvoiceEditor({
  doc,
  onChange,
}: {
  doc: GstInvoiceDoc
  onChange: (path: string, value: string) => void
}) {
  const line = doc.lines[0]
  return (
    <>
      <Field label="Shipper name" htmlFor="invShipper">
        <Input
          id="invShipper"
          value={doc.shipperName}
          onChange={(e) => onChange('shipperName', e.target.value)}
        />
      </Field>
      <Field label="Shipper address" htmlFor="invShipperAddress">
        <Textarea
          id="invShipperAddress"
          rows={3}
          value={doc.shipperAddress}
          onChange={(e) => onChange('shipperAddress', e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Invoice no." htmlFor="invoiceNumber">
          <Input
            id="invoiceNumber"
            value={doc.invoiceNumber}
            onChange={(e) => onChange('invoiceNumber', e.target.value)}
          />
        </Field>
        <Field label="Invoice date" htmlFor="invoiceDate">
          <Input
            id="invoiceDate"
            value={doc.invoiceDate}
            onChange={(e) => onChange('invoiceDate', e.target.value)}
          />
        </Field>
      </div>
      <Field label="IGST payment status" htmlFor="igst">
        <Select
          id="igst"
          value={doc.igstPaymentStatus}
          onChange={(e) => onChange('igstPaymentStatus', e.target.value)}
        >
          <option value="not_applicable">Not applicable</option>
          <option value="lut_bond">LUT or export under bond</option>
          <option value="against_igst">Against payment of IGST</option>
        </Select>
      </Field>
      <Field label="Consignee attention" htmlFor="attn">
        <Input
          id="attn"
          value={doc.consigneeAttention}
          onChange={(e) => onChange('consigneeAttention', e.target.value)}
        />
      </Field>
      <Field label="Consignee name" htmlFor="invConsignee">
        <Input
          id="invConsignee"
          value={doc.consigneeName}
          onChange={(e) => onChange('consigneeName', e.target.value)}
        />
      </Field>
      <Field label="Consignee address" htmlFor="invConsigneeAddress">
        <Textarea
          id="invConsigneeAddress"
          rows={3}
          value={doc.consigneeAddress}
          onChange={(e) => onChange('consigneeAddress', e.target.value)}
        />
      </Field>
      <Field label="GSTIN" htmlFor="gstin">
        <Input id="gstin" value={doc.gstin} onChange={(e) => onChange('gstin', e.target.value)} />
      </Field>
      {line ? (
        <>
          <Field label="Line description" htmlFor="lineDesc">
            <Input
              id="lineDesc"
              value={line.description}
              onChange={(e) => onChange('lines.0.description', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="HSN" htmlFor="hsn">
              <Input
                id="hsn"
                value={line.hsnCode}
                onChange={(e) => onChange('lines.0.hsnCode', e.target.value)}
              />
            </Field>
            <Field label="Qty" htmlFor="qty">
              <Input
                id="qty"
                value={line.quantity}
                onChange={(e) => onChange('lines.0.quantity', e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Rate" htmlFor="rate">
              <Input
                id="rate"
                value={line.rate}
                onChange={(e) => onChange('lines.0.rate', e.target.value)}
              />
            </Field>
            <Field label="Total value" htmlFor="totalValue">
              <Input
                id="totalValue"
                value={line.totalValue}
                onChange={(e) => onChange('lines.0.totalValue', e.target.value)}
              />
            </Field>
          </div>
        </>
      ) : null}
      <Field label="Amount in words" htmlFor="words">
        <Input
          id="words"
          value={doc.amountInWords}
          onChange={(e) => onChange('amountInWords', e.target.value)}
        />
      </Field>
      <Field label="Grand total" htmlFor="grand">
        <Input
          id="grand"
          value={doc.grandTotal}
          onChange={(e) => onChange('grandTotal', e.target.value)}
        />
      </Field>
    </>
  )
}

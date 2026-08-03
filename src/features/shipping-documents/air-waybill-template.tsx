import type { ReactNode } from 'react'
import { TrackingBarcode } from '@/features/shipping-documents/tracking-barcode'
import type { AirWaybillDoc } from '@/types/shipping-document'
import { cn } from '@/utils/cn'

function Cell({
  label,
  children,
  className,
}: {
  label: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('border border-black p-1.5', className)}>
      <p className="text-[8px] font-semibold uppercase tracking-wide text-neutral-700">{label}</p>
      <div className="mt-0.5 min-h-4 text-[11px] font-medium leading-tight">{children}</div>
    </div>
  )
}

function Check({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px]">
      <span
        className={cn(
          'inline-flex size-3 items-center justify-center border border-black text-[8px]',
          on && 'bg-black text-white',
        )}
        aria-hidden
      >
        {on ? '✓' : ''}
      </span>
      {label}
    </span>
  )
}

/** Printable air waybill — dense bordered grid (Linex-style). */
export function AirWaybillTemplate({ doc }: { doc: AirWaybillDoc }) {
  return (
    <article className="shipping-doc air-waybill mx-auto w-full max-w-[210mm] bg-white text-black">
      <div className="flex items-center justify-between gap-3 border border-black p-2">
        <div>
          <p className="text-base font-black tracking-tight">{doc.carrierName}</p>
          <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">Air waybill</p>
        </div>
        <div className="min-w-0 flex-1 px-4">
          <TrackingBarcode value={doc.motherNumber} height={40} />
          <p className="mt-0.5 text-center text-xs font-bold tracking-widest">{doc.motherNumber}</p>
        </div>
        <div className="text-right text-[10px]">
          <p className="font-semibold">Mother No.</p>
          <p className="text-sm font-bold">{doc.motherNumber}</p>
        </div>
      </div>

      <div className="mt-0 grid grid-cols-[1.1fr_1.2fr_0.9fr]">
        <div className="space-y-0">
          <Cell label="Shipper’s A/C No.">{doc.shipper.accountNo}</Cell>
          <Cell label="Shipper’s Reference">{doc.shipper.reference}</Cell>
          <Cell label="Shipper’s Name">{doc.shipper.name}</Cell>
          <Cell label="Address" className="min-h-20">
            {doc.shipper.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </Cell>
          <Cell label="Contact / Tel">
            {doc.shipper.contact} · {doc.shipper.phone}
          </Cell>
          <Cell label="Payment Type">
            <div className="flex flex-wrap gap-2">
              <Check on={doc.paymentType === 'account'} label="A/C" />
              <Check on={doc.paymentType === 'cash'} label="CASH" />
              <Check on={doc.paymentType === 'collect'} label="COLLECT" />
            </div>
          </Cell>
          <div className="grid grid-cols-2">
            <Cell label="Pieces">{doc.pieces}</Cell>
            <Cell label="Actual Wt (kg)">{doc.actualWeightKg}</Cell>
          </div>
          <Cell label="Shipper Signature / Date">{doc.shipperDate}</Cell>
        </div>

        <div>
          <Cell label="Consignee’s Name">{doc.consignee.name}</Cell>
          <Cell label="Address" className="min-h-16">
            {doc.consignee.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </Cell>
          <div className="grid grid-cols-2">
            <Cell label="City">{doc.consignee.city}</Cell>
            <Cell label="Zip / Postal">{doc.consignee.postalCode}</Cell>
          </div>
          <div className="grid grid-cols-2">
            <Cell label="State / Province">{doc.consignee.state}</Cell>
            <Cell label="Country">{doc.consignee.country}</Cell>
          </div>
          <Cell label="Contact / Tel">
            {doc.consignee.contact} · {doc.consignee.phone}
          </Cell>
          <Cell label="Shipper VAT / GST">{doc.shipperVat || '—'}</Cell>
          <Cell label="Receiver VAT / GST">{doc.receiverVat || '—'}</Cell>
          <Cell label="Harmonized Commodity Code">{doc.hsCode}</Cell>
          <Cell label="Receiver Signature" className="min-h-12">
            {' '}
          </Cell>
        </div>

        <div>
          <div className="grid grid-cols-2">
            <Cell label="Airport of Departure">{doc.departureAirport}</Cell>
            <Cell label="Airport of Destination">{doc.destinationAirport}</Cell>
          </div>
          <Cell label="Service Type">
            <div className="flex flex-col gap-1">
              <Check on={doc.serviceType === 'airport_to_airport'} label="AIRPORT TO AIRPORT" />
              <Check on={doc.serviceType === 'airport_to_door'} label="AIRPORT TO DOOR" />
              <Check on={doc.serviceType === 'pickup'} label="PICKUP" />
            </div>
          </Cell>
          <Cell label="Declared Value for Carriage">
            {doc.declaredValue} {doc.declaredCurrency}
          </Cell>
          <Cell label="Amount of Cargo Insurance">{doc.insuranceAmount || '—'}</Cell>
          <Cell label="COD Amount">{doc.codAmount || '—'}</Cell>
          <Cell label="Special Handling Instructions" className="min-h-14">
            {doc.specialInstructions}
          </Cell>
          <Cell label="Picked up by / Date / Time" className="min-h-10">
            {' '}
          </Cell>
        </div>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr]">
        <Cell label="Description of Goods" className="min-h-14">
          {doc.descriptionOfGoods}
        </Cell>
        <div>
          <Cell label="Dimensions / Vol Wt">
            {doc.dimensions || '—'} / {doc.volumetricWeightKg || '—'} kg
          </Cell>
          <Cell label="Chargeable Weight (kg)">{doc.chargeableWeightKg}</Cell>
          <div className="grid grid-cols-3">
            <Cell label="Currency">{doc.currency}</Cell>
            <Cell label="Surcharges">{doc.surcharges || '—'}</Cell>
            <Cell label="Total">{doc.total}</Cell>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between border border-black px-2 py-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{doc.copyLabel}</p>
        <div className="w-48">
          <TrackingBarcode value={doc.motherNumber} height={28} />
        </div>
      </div>
    </article>
  )
}

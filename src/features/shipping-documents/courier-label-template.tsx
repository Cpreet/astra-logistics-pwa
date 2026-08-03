import { TrackingBarcode } from '@/features/shipping-documents/tracking-barcode'
import type { ShippingLabelDoc } from '@/types/shipping-document'

/** Printable courier label — SHIP FROM / SHIP TO / barcode / tracking. */
export function CourierLabelTemplate({ doc }: { doc: ShippingLabelDoc }) {
  return (
    <article className="shipping-doc courier-label mx-auto w-full max-w-[210mm] bg-white text-black">
      <div className="flex items-center justify-between border-b border-black px-3 py-1 text-[10px]">
        <span>{doc.printedAt}</span>
        <span>{doc.pageLabel}</span>
      </div>

      <div className="flex items-end justify-between gap-4 border-b border-black px-3 py-3">
        <div>
          <p className="text-lg font-black tracking-tight">{doc.partnerName}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">Logistics partner</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tracking-tight">{doc.carrierName}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
            {doc.carrierTagline}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] border-b border-black">
        <div className="border-r border-black px-3 py-2">
          <p className="text-xs font-bold">SHIP FROM:</p>
          <dl className="mt-1 space-y-0.5 text-[11px] leading-snug">
            {doc.shipFrom.id ? (
              <div>
                <dt className="inline font-semibold">ID: </dt>
                <dd className="inline">{doc.shipFrom.id}</dd>
              </div>
            ) : null}
            <div>
              <dt className="inline font-semibold">Name: </dt>
              <dd className="inline">{doc.shipFrom.name}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Phone: </dt>
              <dd className="inline">{doc.shipFrom.phone}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Company: </dt>
              <dd className="inline">{doc.shipFrom.company}</dd>
            </div>
            <div className="pt-1">
              {doc.shipFrom.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </dl>
        </div>
        <div className="px-3 py-2 text-[11px] leading-snug">
          <p>
            <span className="font-semibold">SHP WT: </span>
            {doc.weightKg}KG
          </p>
          <p>
            <span className="font-semibold">SHP DWT: </span>
            {doc.dimensionalWeightKg || '—'}KG
          </p>
          <p>
            <span className="font-semibold">DATE: </span>
            {doc.shipDate}
          </p>
          <p>
            <span className="font-semibold">DIM: </span>
            {doc.dimensions}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] border-b border-black">
        <div className="px-3 py-2">
          <p className="text-xs font-bold">SHIP TO:</p>
          <p className="mt-1 text-sm font-semibold">{doc.shipTo.name}</p>
          <p className="text-[11px]">Phone: {doc.shipTo.phone}</p>
          <p className="text-[11px] font-medium">{doc.shipTo.company}</p>
          <div className="mt-1 text-[11px] leading-snug">
            {doc.shipTo.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center border-l border-black px-4">
          <span className="border-2 border-black px-3 py-2 text-4xl font-black tracking-wider">
            {doc.shipTo.countryCode}
          </span>
        </div>
      </div>

      <div className="border-b border-black px-3 py-3">
        <TrackingBarcode value={doc.trackingNumber} height={64} />
        <p className="mt-2 text-center text-2xl font-bold tracking-[0.18em]">
          {doc.trackingNumber}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-[11px]">
        <p>
          <span className="font-semibold">BILLING: </span>
          {doc.billing || '—'}
        </p>
        <p className="col-span-1">
          <span className="font-semibold">DESC: </span>
          {doc.description}
        </p>
        <p>
          <span className="font-semibold">Reference: </span>
          {doc.reference}
        </p>
      </div>
    </article>
  )
}

import type { GstInvoiceDoc, IgstPaymentStatus } from '@/types/shipping-document'
import { cn } from '@/utils/cn'

function IgstOption({
  value,
  current,
  label,
}: {
  value: IgstPaymentStatus
  current: IgstPaymentStatus
  label: string
}) {
  const on = value === current
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px]">
      <span
        className={cn(
          'inline-flex size-3 items-center justify-center border border-black text-[8px]',
          on && 'bg-black text-white',
        )}
      >
        {on ? '✓' : ''}
      </span>
      {label}
    </span>
  )
}

/** Printable GST commercial invoice — bordered export form. */
export function GstInvoiceTemplate({ doc }: { doc: GstInvoiceDoc }) {
  return (
    <article className="shipping-doc gst-invoice mx-auto w-full max-w-[210mm] bg-white text-black">
      <div className="border border-black">
        <div className="grid grid-cols-[1.4fr_1fr] border-b border-black">
          <div className="border-r border-black p-2">
            <p className="text-[10px] font-semibold uppercase">Shipper name & address</p>
            <p className="mt-1 text-sm font-bold uppercase">{doc.shipperName}</p>
            <p className="mt-1 text-[11px] leading-snug">{doc.shipperAddress}</p>
            <p className="mt-1 text-[11px]">Telephone No: {doc.shipperPhone}</p>
            <p className="mt-2 text-[10px]">
              IEC / PAN / Aadhar / Passport No.: {doc.shipperTaxIds || '—'}
            </p>
          </div>
          <div className="p-2 text-[11px]">
            <p>
              <span className="font-semibold">GST Invoice No: </span>
              {doc.invoiceNumber}
            </p>
            <p>
              <span className="font-semibold">GST Invoice date: </span>
              {doc.invoiceDate}
            </p>
            <p>
              <span className="font-semibold">Place of Supply: </span>
              {doc.placeOfSupply || '—'}
            </p>
            <p>
              <span className="font-semibold">State Name: </span>
              {doc.stateName}
            </p>
          </div>
        </div>

        <div className="border-b border-black px-2 py-2">
          <p className="text-[10px] font-semibold uppercase">IGST Payment Status</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <IgstOption
              value="not_applicable"
              current={doc.igstPaymentStatus}
              label="A) Not Applicable"
            />
            <IgstOption
              value="lut_bond"
              current={doc.igstPaymentStatus}
              label="B) LUT or Export under Bond"
            />
            <IgstOption
              value="against_igst"
              current={doc.igstPaymentStatus}
              label="C) Export Against Payment of IGST"
            />
          </div>
        </div>

        <div className="grid grid-cols-[1.4fr_1fr] border-b border-black">
          <div className="border-r border-black p-2">
            <p className="text-[10px] font-semibold uppercase">Consignee</p>
            <p className="mt-1 text-[11px]">
              <span className="font-semibold">ATTN: </span>
              {doc.consigneeAttention}
            </p>
            <p className="text-sm font-bold uppercase">{doc.consigneeName}</p>
            <p className="mt-1 text-[11px] leading-snug">{doc.consigneeAddress}</p>
            <p className="mt-1 text-[11px] font-semibold">Country: {doc.consigneeCountry}</p>
          </div>
          <div className="space-y-1 p-2 text-[11px]">
            <p>
              <span className="font-semibold">GSTIN / UIN: </span>
              {doc.gstin}
            </p>
            <p>
              <span className="font-semibold">Vehicle number: </span>
              {doc.vehicleNumber || '—'}
            </p>
            <p>
              <span className="font-semibold">Date of Supply: </span>
              {doc.dateOfSupply || '—'}
            </p>
            <p>
              <span className="font-semibold">State Code: </span>
              {doc.stateCode}
            </p>
          </div>
        </div>

        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-black bg-neutral-100 text-left">
              <th className="border-r border-black px-1.5 py-1 font-semibold">S. No.</th>
              <th className="border-r border-black px-1.5 py-1 font-semibold">Product Description</th>
              <th className="border-r border-black px-1.5 py-1 font-semibold">HSN Code</th>
              <th className="border-r border-black px-1.5 py-1 font-semibold">Qty</th>
              <th className="border-r border-black px-1.5 py-1 font-semibold">Rate</th>
              <th className="border-r border-black px-1.5 py-1 font-semibold">Total Value</th>
              <th className="border-r border-black px-1.5 py-1 font-semibold">IGST %</th>
              <th className="px-1.5 py-1 font-semibold">Value in INR</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((line) => (
              <tr key={line.serial} className="border-b border-black">
                <td className="border-r border-black px-1.5 py-1.5">{line.serial}</td>
                <td className="border-r border-black px-1.5 py-1.5 font-medium">
                  {line.description}
                </td>
                <td className="border-r border-black px-1.5 py-1.5">{line.hsnCode}</td>
                <td className="border-r border-black px-1.5 py-1.5">{line.quantity}</td>
                <td className="border-r border-black px-1.5 py-1.5">{line.rate}</td>
                <td className="border-r border-black px-1.5 py-1.5">{line.totalValue}</td>
                <td className="border-r border-black px-1.5 py-1.5">{line.igstRate || '—'}</td>
                <td className="px-1.5 py-1.5">{line.valueInr || '—'}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 4 - doc.lines.length) }).map((_, index) => (
              <tr key={`empty-${index}`} className="border-b border-black">
                <td className="border-r border-black px-1.5 py-3">&nbsp;</td>
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td />
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-[1.4fr_1fr] border-b border-black">
          <div className="border-r border-black p-2 text-[11px]">
            <p className="font-semibold">Invoice Amount before Tax in Words</p>
            <p className="mt-1 uppercase">{doc.amountInWords}</p>
          </div>
          <div className="p-2 text-[11px]">
            <div className="flex justify-between border-b border-black py-1">
              <span>Total Amount before Tax</span>
              <span className="font-semibold">{doc.totalBeforeTax}</span>
            </div>
            <div className="flex justify-between border-b border-black py-1">
              <span>IGST in INR</span>
              <span>{doc.igstInInr || '—'}</span>
            </div>
            <div className="flex justify-between py-1 font-bold">
              <span>Total</span>
              <span>{doc.grandTotal}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1.4fr_1fr]">
          <div className="border-r border-black p-2 text-[10px] leading-snug">
            <p>{doc.declaration}</p>
            <p className="mt-3">
              Certified that the particulars given above are true and correct
            </p>
            <p className="mt-1 font-semibold">For {doc.shipperName}</p>
          </div>
          <div className="flex min-h-24 flex-col justify-end p-2 text-[11px]">
            <div className="border-t border-black pt-8 text-center font-semibold">
              {doc.authorisedSignatoryLabel}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

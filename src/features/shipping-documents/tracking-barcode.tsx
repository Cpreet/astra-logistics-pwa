import { barcodeBars, barcodeViewBox } from '@/domain/shipping-documents/barcode'

/** SVG barcode used on courier labels and air waybills. */
export function TrackingBarcode({
  value,
  className,
  height = 56,
}: {
  value: string
  className?: string
  height?: number
}) {
  const bars = barcodeBars(value)
  const box = barcodeViewBox(value)

  return (
    <svg
      role="img"
      aria-label={`Barcode for ${value}`}
      viewBox={`0 0 ${box.width} ${box.height}`}
      className={className}
      style={{ height, width: '100%' }}
      preserveAspectRatio="none"
    >
      <rect x={0} y={0} width={box.width} height={box.height} fill="#fff" />
      {bars.map((bar, index) => (
        <rect
          key={`${bar.x}-${index}`}
          x={bar.x}
          y={2}
          width={bar.width}
          height={box.height - 4}
          fill="#111"
        />
      ))}
    </svg>
  )
}

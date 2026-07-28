export function Progress({
  value,
  max = 100,
  label,
}: {
  value: number
  max?: number
  label?: string
}) {
  const percent = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-raised"
    >
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

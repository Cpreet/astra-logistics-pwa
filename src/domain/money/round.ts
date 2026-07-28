import type { RoundingMode } from '@/domain/money/types'

/**
 * Round `numerator / denominator` to an integer using the chosen mode.
 * Inputs must be finite numbers; denominator must be a positive integer power of ten or weight sum.
 */
export function roundQuotient(
  numerator: number,
  denominator: number,
  mode: RoundingMode = 'half_up',
): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    throw new Error('Non-finite value in monetary rounding')
  }
  if (denominator === 0) {
    throw new Error('Division by zero in monetary rounding')
  }

  const sign = Math.sign(numerator) || 1
  const absNum = Math.abs(numerator)
  const absDen = Math.abs(denominator)
  const whole = Math.floor(absNum / absDen)
  const remainder = absNum % absDen
  if (remainder === 0) {
    return sign * whole
  }

  const twice = remainder * 2
  const isHalfway = twice === absDen
  const aboveHalf = twice > absDen

  let bump = 0
  switch (mode) {
    case 'floor':
      bump = sign < 0 ? 1 : 0
      break
    case 'ceil':
      bump = sign > 0 ? 1 : 0
      break
    case 'half_up':
      bump = aboveHalf || isHalfway ? 1 : 0
      break
    case 'half_even':
      if (aboveHalf) bump = 1
      else if (isHalfway) bump = whole % 2 === 0 ? 0 : 1
      else bump = 0
      break
    default: {
      const _exhaustive: never = mode
      throw new Error(`Unknown rounding mode: ${_exhaustive}`)
    }
  }

  return sign * (whole + bump)
}

export function pow10(scale: number): number {
  if (!Number.isInteger(scale) || scale < 0 || scale > 15) {
    throw new Error(`Unsupported decimal scale: ${scale}`)
  }
  return 10 ** scale
}

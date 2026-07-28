import { currencyDecimals, normalizeCurrency } from '@/domain/money/currency'
import { pow10, roundQuotient } from '@/domain/money/round'
import { MoneyError, type Money, type RoundingMode } from '@/domain/money/types'

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(
      'E_INVALID_MONEY',
      `${label} must be a safe integer minor-unit amount. Got ${value}.`,
    )
  }
}

/** Construct a Money value. `amountMinor` must already be an integer. */
export function money(amountMinor: number, currency: string): Money {
  assertSafeInteger(amountMinor, 'amountMinor')
  return Object.freeze({
    amountMinor,
    currency: normalizeCurrency(currency),
  })
}

export function zero(currency: string): Money {
  return money(0, currency)
}

/**
 * Parse a major-unit decimal string (e.g. "12.50") into minor units.
 * Avoids float parsing of currency amounts.
 */
export function fromMajorString(major: string, currency: string): Money {
  const code = normalizeCurrency(currency)
  const decimals = currencyDecimals(code)
  const trimmed = major.trim()
  const match = /^(-)?(\d+)(?:\.(\d+))?$/.exec(trimmed)
  if (!match) {
    throw new MoneyError(
      'E_INVALID_MONEY',
      `Could not parse "${major}" as a major-unit amount. Use a decimal string such as "12.50".`,
    )
  }

  const negative = match[1] === '-'
  const whole = match[2]
  const fraction = (match[3] ?? '').padEnd(decimals, '0')
  if (fraction.length > decimals) {
    throw new MoneyError(
      'E_INVALID_MONEY',
      `"${major}" has more than ${decimals} decimal places for ${code}.`,
    )
  }

  const minor = Number(whole) * pow10(decimals) + Number(fraction || '0')
  return money(negative ? -minor : minor, code)
}

export function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new MoneyError(
      'E_CURRENCY_MISMATCH',
      `Currency mismatch: ${a.currency} vs ${b.currency}. Convert explicitly before combining.`,
    )
  }
}

export function add(...amounts: Money[]): Money {
  if (amounts.length === 0) {
    throw new MoneyError('E_INVALID_MONEY', 'add() requires at least one Money value.')
  }
  let total = amounts[0]!
  for (let i = 1; i < amounts.length; i += 1) {
    const next = amounts[i]!
    assertSameCurrency(total, next)
    total = money(total.amountMinor + next.amountMinor, total.currency)
  }
  return total
}

export function subtract(left: Money, right: Money): Money {
  assertSameCurrency(left, right)
  return money(left.amountMinor - right.amountMinor, left.currency)
}

export function negate(value: Money): Money {
  return money(-value.amountMinor, value.currency)
}

export function compare(left: Money, right: Money): number {
  assertSameCurrency(left, right)
  return left.amountMinor === right.amountMinor
    ? 0
    : left.amountMinor > right.amountMinor
      ? 1
      : -1
}

/**
 * Multiply a money amount by a dimensionless rate expressed as `rateScaled / 10^rateScale`.
 * Example: 20% tax → `multiplyByRate(amount, 20, 2)`.
 */
export function multiplyByRate(
  amount: Money,
  rateScaled: number,
  rateScale: number,
  rounding: RoundingMode = 'half_up',
): Money {
  if (!Number.isSafeInteger(rateScaled)) {
    throw new MoneyError(
      'E_INVALID_RATE',
      `rateScaled must be a safe integer. Got ${rateScaled}.`,
    )
  }
  if (!Number.isInteger(rateScale) || rateScale < 0) {
    throw new MoneyError(
      'E_INVALID_RATE',
      `rateScale must be a non-negative integer. Got ${rateScale}.`,
    )
  }

  const denominator = pow10(rateScale)
  const product = amount.amountMinor * rateScaled
  return money(roundQuotient(product, denominator, rounding), amount.currency)
}

/**
 * Line amount from quantity × unit rate.
 * `quantityScaled / 10^quantityScale` × `rateMinor` (rate already in minor units per 1.0 quantity).
 */
export function multiplyQuantityByUnitRate(
  quantityScaled: number,
  quantityScale: number,
  rateMinor: number,
  currency: string,
  rounding: RoundingMode = 'half_up',
): Money {
  if (!Number.isSafeInteger(quantityScaled) || !Number.isSafeInteger(rateMinor)) {
    throw new MoneyError(
      'E_INVALID_RATE',
      'quantityScaled and rateMinor must be safe integers.',
    )
  }
  if (!Number.isInteger(quantityScale) || quantityScale < 0) {
    throw new MoneyError(
      'E_INVALID_RATE',
      `quantityScale must be a non-negative integer. Got ${quantityScale}.`,
    )
  }
  const denominator = pow10(quantityScale)
  return money(
    roundQuotient(quantityScaled * rateMinor, denominator, rounding),
    currency,
  )
}

/**
 * Convert using an explicit FX rate: 1 unit of `amount.currency` = `rateScaled / 10^rateScale`
 * units of `toCurrency` (in major units of each side; applied to minor via decimal adjustment).
 *
 * Rate is defined on major units. Example: USD→EUR at 0.92 → rateScaled=92, rateScale=2.
 */
export function convert(
  amount: Money,
  toCurrency: string,
  rateScaled: number,
  rateScale: number,
  rounding: RoundingMode = 'half_up',
): Money {
  const target = normalizeCurrency(toCurrency)
  if (!Number.isSafeInteger(rateScaled) || rateScaled <= 0) {
    throw new MoneyError(
      'E_INVALID_RATE',
      `FX rateScaled must be a positive safe integer. Got ${rateScaled}.`,
    )
  }
  if (!Number.isInteger(rateScale) || rateScale < 0) {
    throw new MoneyError(
      'E_INVALID_RATE',
      `FX rateScale must be a non-negative integer. Got ${rateScale}.`,
    )
  }
  if (amount.currency === target) {
    return amount
  }

  const fromDecimals = currencyDecimals(amount.currency)
  const toDecimals = currencyDecimals(target)
  // major_from = amountMinor / 10^fromDecimals
  // major_to = major_from * (rateScaled / 10^rateScale)
  // minor_to = major_to * 10^toDecimals
  // = amountMinor * rateScaled * 10^toDecimals / (10^fromDecimals * 10^rateScale)
  const numerator = amount.amountMinor * rateScaled * pow10(toDecimals)
  const denominator = pow10(fromDecimals) * pow10(rateScale)
  return money(roundQuotient(numerator, denominator, rounding), target)
}

/**
 * Largest-remainder allocation. Parts always sum exactly to `total`.
 * Zero total with positive weights yields zeros. Negative weights are refused.
 */
export function allocate(total: Money, weights: readonly number[]): Money[] {
  if (weights.length === 0) {
    throw new MoneyError('E_INVALID_MONEY', 'allocate() requires at least one weight.')
  }
  for (const weight of weights) {
    if (!Number.isFinite(weight) || weight < 0) {
      throw new MoneyError(
        'E_NEGATIVE_WEIGHT',
        'Allocation weights must be finite and non-negative.',
      )
    }
  }

  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  if (weightSum === 0) {
    if (total.amountMinor !== 0) {
      throw new MoneyError(
        'E_DIVISION_BY_ZERO',
        'Cannot allocate a non-zero amount across all-zero weights.',
      )
    }
    return weights.map(() => zero(total.currency))
  }

  const sign = Math.sign(total.amountMinor) || 1
  const absTotal = Math.abs(total.amountMinor)

  const floors: number[] = []
  const fractions: Array<{ index: number; fraction: number }> = []

  for (let i = 0; i < weights.length; i += 1) {
    const exact = (absTotal * weights[i]!) / weightSum
    const floored = Math.floor(exact)
    floors.push(floored)
    fractions.push({ index: i, fraction: exact - floored })
  }

  let remainder = absTotal - floors.reduce((sum, value) => sum + value, 0)
  fractions.sort((a, b) => {
    if (b.fraction !== a.fraction) return b.fraction - a.fraction
    return a.index - b.index
  })

  for (let i = 0; i < fractions.length && remainder > 0; i += 1) {
    floors[fractions[i]!.index]! += 1
    remainder -= 1
  }

  return floors.map((value) => money(sign * value, total.currency))
}

/**
 * Margin amount and basis points (1% = 100 bps) from buy/sell totals.
 * Disbursements should already be excluded by the caller (`D-23`).
 */
export function marginOf(sell: Money, buy: Money): {
  margin: Money
  /** Basis points of sell; `null` when sell is zero. */
  marginBps: number | null
} {
  assertSameCurrency(sell, buy)
  const margin = subtract(sell, buy)
  if (sell.amountMinor === 0) {
    return { margin, marginBps: null }
  }
  // bps = margin / sell * 10000, half-up
  const marginBps = roundQuotient(margin.amountMinor * 10_000, Math.abs(sell.amountMinor), 'half_up')
  return { margin, marginBps }
}

export function format(
  amount: Money,
  locale = 'en-GB',
  options?: Intl.NumberFormatOptions,
): string {
  const decimals = currencyDecimals(amount.currency)
  const major = amount.amountMinor / pow10(decimals)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: amount.currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...options,
  }).format(major)
}

import { MoneyError } from '@/domain/money/types'

/** ISO 4217 minor-unit exponent. Default is 2 when the currency is unknown. */
const KNOWN_DECIMALS: Record<string, number> = {
  BHD: 3,
  BIF: 0,
  CLF: 4,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  IQD: 3,
  ISK: 0,
  JOD: 3,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  PYG: 0,
  RWF: 0,
  TND: 3,
  UGX: 0,
  UYI: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
}

export function currencyDecimals(currency: string): number {
  const code = currency.toUpperCase()
  return KNOWN_DECIMALS[code] ?? 2
}

export function normalizeCurrency(currency: string): string {
  const code = currency.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new MoneyError(
      'E_INVALID_MONEY',
      `Invalid currency code "${currency}". Use a 3-letter ISO 4217 code.`,
    )
  }
  return code
}

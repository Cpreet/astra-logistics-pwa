/** Integer minor-unit money (`D-25` / `spec.md` §5.17). Never use floats for finance. */
export interface Money {
  readonly amountMinor: number
  readonly currency: string
}

export type RoundingMode = 'half_up' | 'half_even' | 'floor' | 'ceil'

export type MoneyErrorCode =
  | 'E_CURRENCY_MISMATCH'
  | 'E_INVALID_MONEY'
  | 'E_INVALID_RATE'
  | 'E_DIVISION_BY_ZERO'
  | 'E_NEGATIVE_WEIGHT'

export class MoneyError extends Error {
  readonly code: MoneyErrorCode

  constructor(code: MoneyErrorCode, message: string) {
    super(message)
    this.name = 'MoneyError'
    this.code = code
  }
}

export type { Money, MoneyErrorCode, RoundingMode } from '@/domain/money/types'
export { MoneyError } from '@/domain/money/types'
export { currencyDecimals, normalizeCurrency } from '@/domain/money/currency'
export {
  add,
  allocate,
  assertSameCurrency,
  compare,
  convert,
  format,
  fromMajorString,
  marginOf,
  money,
  multiplyByRate,
  multiplyQuantityByUnitRate,
  negate,
  subtract,
  zero,
} from '@/domain/money/money'

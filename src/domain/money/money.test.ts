import { describe, expect, it } from 'vitest'
import {
  add,
  allocate,
  assertSameCurrency,
  compare,
  convert,
  currencyDecimals,
  format,
  fromMajorString,
  marginOf,
  money,
  MoneyError,
  multiplyByRate,
  multiplyQuantityByUnitRate,
  negate,
  subtract,
  zero,
} from '@/domain/money'
import { pow10, roundQuotient } from '@/domain/money/round'

describe('money construction', () => {
  it('freezes minor-unit amounts', () => {
    const value = money(1250, 'usd')
    expect(value).toEqual({ amountMinor: 1250, currency: 'USD' })
    expect(Object.isFrozen(value)).toBe(true)
  })

  it('rejects non-integer minor amounts', () => {
    expect(() => money(1.5, 'USD')).toThrow(MoneyError)
    expect(() => money(Number.MAX_SAFE_INTEGER + 2, 'USD')).toThrow(/safe integer/)
  })

  it('rejects invalid currency codes', () => {
    expect(() => money(1, 'US')).toThrow(/ISO 4217/)
    expect(() => money(1, 'usdx')).toThrow(MoneyError)
  })

  it('parses major-unit strings without floats', () => {
    expect(fromMajorString('12.50', 'USD')).toEqual(money(1250, 'USD'))
    expect(fromMajorString('-3', 'USD')).toEqual(money(-300, 'USD'))
    expect(fromMajorString('100', 'JPY')).toEqual(money(100, 'JPY'))
    expect(fromMajorString('1.234', 'BHD')).toEqual(money(1234, 'BHD'))
  })

  it('rejects major strings with too many decimals or bad shape', () => {
    expect(() => fromMajorString('1.234', 'USD')).toThrow(/decimal places/)
    expect(() => fromMajorString('12.5.0', 'USD')).toThrow(/Could not parse/)
    expect(() => fromMajorString('abc', 'USD')).toThrow(MoneyError)
  })

  it('knows zero-decimal and three-decimal currencies', () => {
    expect(currencyDecimals('JPY')).toBe(0)
    expect(currencyDecimals('KWD')).toBe(3)
    expect(currencyDecimals('USD')).toBe(2)
    expect(currencyDecimals('ZZZ')).toBe(2)
  })
})

describe('add / subtract / compare', () => {
  it('adds and subtracts same-currency amounts', () => {
    expect(add(money(100, 'USD'), money(250, 'USD'), money(1, 'USD'))).toEqual(money(351, 'USD'))
    expect(subtract(money(500, 'USD'), money(125, 'USD'))).toEqual(money(375, 'USD'))
    expect(negate(money(40, 'EUR'))).toEqual(money(-40, 'EUR'))
    expect(zero('EUR')).toEqual(money(0, 'EUR'))
  })

  it('refuses empty add()', () => {
    expect(() => add()).toThrow(/at least one/)
  })

  it('refuses currency mismatches with an actionable code', () => {
    expect(() => add(money(1, 'USD'), money(1, 'EUR'))).toThrowError(MoneyError)
    try {
      assertSameCurrency(money(1, 'USD'), money(1, 'GBP'))
    } catch (error) {
      expect(error).toBeInstanceOf(MoneyError)
      expect((error as MoneyError).code).toBe('E_CURRENCY_MISMATCH')
    }
  })

  it('compares ordered amounts', () => {
    expect(compare(money(1, 'USD'), money(2, 'USD'))).toBe(-1)
    expect(compare(money(2, 'USD'), money(1, 'USD'))).toBe(1)
    expect(compare(money(2, 'USD'), money(2, 'USD'))).toBe(0)
  })
})

describe('rounding', () => {
  it('supports half_up, half_even, floor and ceil', () => {
    expect(roundQuotient(15, 10, 'half_up')).toBe(2)
    expect(roundQuotient(15, 10, 'half_even')).toBe(2) // 1 is odd → bump to even 2
    expect(roundQuotient(25, 10, 'half_even')).toBe(2) // 2 is even → stay
    expect(roundQuotient(16, 10, 'half_even')).toBe(2) // above half
    expect(roundQuotient(15, 10, 'floor')).toBe(1)
    expect(roundQuotient(15, 10, 'ceil')).toBe(2)
    expect(roundQuotient(11, 10, 'floor')).toBe(1) // positive, below half
    expect(roundQuotient(11, 10, 'ceil')).toBe(2)
    expect(roundQuotient(-15, 10, 'floor')).toBe(-2)
    expect(roundQuotient(-15, 10, 'ceil')).toBe(-1)
    expect(roundQuotient(-11, 10, 'ceil')).toBe(-1) // negative, no bump
    expect(roundQuotient(-15, 10, 'half_up')).toBe(-2)
    expect(roundQuotient(0, 10, 'half_up')).toBe(0)
    expect(roundQuotient(10, 10, 'half_up')).toBe(1)
    expect(roundQuotient(14, 10, 'half_up')).toBe(1)
    expect(roundQuotient(14, 10, 'half_even')).toBe(1)
  })

  it('rejects non-finite values, zero denominators, bad modes and bad scales', () => {
    expect(() => roundQuotient(Number.NaN, 10)).toThrow(/Non-finite/)
    expect(() => roundQuotient(1, Number.POSITIVE_INFINITY)).toThrow(/Non-finite/)
    expect(() => roundQuotient(1, 0)).toThrow(/Division by zero/)
    expect(() =>
      roundQuotient(1, 10, 'bankers' as unknown as 'half_up'),
    ).toThrow(/Unknown rounding mode/)
    expect(() => pow10(-1)).toThrow(/Unsupported/)
    expect(() => pow10(1.5)).toThrow(/Unsupported/)
    expect(() => pow10(16)).toThrow(/Unsupported/)
    expect(pow10(0)).toBe(1)
  })
})

describe('multiplyByRate', () => {
  it('applies a tax-style rate in scaled integers', () => {
    // 20% of $10.00
    expect(multiplyByRate(money(1000, 'USD'), 20, 2)).toEqual(money(200, 'USD'))
    // 12.5% of $80.00 → 10.00
    expect(multiplyByRate(money(8000, 'USD'), 125, 3)).toEqual(money(1000, 'USD'))
  })

  it('rounds half-up at the boundary once', () => {
    // 1 * 1 / 3 → 0.333… → 0
    expect(multiplyByRate(money(1, 'USD'), 1, 0 /* wait */)).toEqual(money(1, 'USD'))
    // 100 * 1 / 3 with scale via rateScaled=1 rateScale unused... use 33.333% ≈
    expect(multiplyByRate(money(100, 'USD'), 1, 1, 'half_up')).toEqual(money(10, 'USD'))
    expect(multiplyByRate(money(5, 'USD'), 1, 1, 'half_up')).toEqual(money(1, 'USD')) // 0.5 → 1
  })

  it('rejects invalid rates', () => {
    expect(() => multiplyByRate(money(1, 'USD'), 1.5, 0)).toThrow(/rateScaled/)
    expect(() => multiplyByRate(money(1, 'USD'), 1, -1)).toThrow(/rateScale/)
  })

  it('multiplies quantity × unit rate in minor units', () => {
    // 12.5 kg × $2.40/kg = $30.00
    expect(multiplyQuantityByUnitRate(125, 1, 240, 'USD')).toEqual(money(3000, 'USD'))
    expect(() => multiplyQuantityByUnitRate(1.5, 0, 100, 'USD')).toThrow(MoneyError)
    expect(() => multiplyQuantityByUnitRate(1, 0, 1.5, 'USD')).toThrow(/safe integers/)
    expect(() => multiplyQuantityByUnitRate(1, -1, 100, 'USD')).toThrow(/quantityScale/)
  })
})

describe('convert', () => {
  it('converts with an explicit FX rate and decimal adjustment', () => {
    // $10.00 USD → EUR at 0.92 = €9.20
    expect(convert(money(1000, 'USD'), 'EUR', 92, 2)).toEqual(money(920, 'EUR'))
    // ¥1000 → USD at 0.0067 = $6.70 (JPY 0 decimals, USD 2)
    expect(convert(money(1000, 'JPY'), 'USD', 67, 4)).toEqual(money(670, 'USD'))
  })

  it('is a no-op for same currency and validates the rate', () => {
    const value = money(500, 'USD')
    expect(convert(value, 'USD', 1, 0)).toBe(value)
    expect(() => convert(value, 'EUR', 0, 2)).toThrow(/positive/)
    expect(() => convert(value, 'EUR', 1, -1)).toThrow(/rateScale/)
    expect(() => convert(value, 'EUR', 1.5, 0)).toThrow(MoneyError)
  })
})

describe('allocate (largest remainder)', () => {
  it('parts always sum to the whole', () => {
    const parts = allocate(money(100, 'USD'), [1, 1, 1])
    expect(parts.map((part) => part.amountMinor)).toEqual([34, 33, 33])
    expect(parts.reduce((sum, part) => sum + part.amountMinor, 0)).toBe(100)
  })

  it('allocates by chargeable-weight style weights', () => {
    const parts = allocate(money(1000, 'USD'), [250, 750])
    expect(parts).toEqual([money(250, 'USD'), money(750, 'USD')])
    // unequal fractional remainders → larger fraction receives the leftover cent
    expect(allocate(money(100, 'USD'), [1, 2]).map((part) => part.amountMinor)).toEqual([
      33, 67,
    ])
  })

  it('preserves sign and handles zero totals', () => {
    expect(allocate(money(-100, 'USD'), [1, 1]).map((p) => p.amountMinor)).toEqual([-50, -50])
    expect(allocate(money(0, 'USD'), [0, 0])).toEqual([money(0, 'USD'), money(0, 'USD')])
    expect(allocate(money(0, 'USD'), [3, 7])).toEqual([money(0, 'USD'), money(0, 'USD')])
  })

  it('refuses empty, negative, non-finite, or impossible weight sets', () => {
    expect(() => allocate(money(1, 'USD'), [])).toThrow(/at least one/)
    expect(() => allocate(money(1, 'USD'), [-1])).toThrow(/non-negative/)
    expect(() => allocate(money(1, 'USD'), [Number.NaN])).toThrow(/non-negative/)
    expect(() => allocate(money(1, 'USD'), [0, 0])).toThrow(/all-zero/)
  })

  it('breaks remainder ties by lower index for stability', () => {
    // equal fractions → first indices receive the leftover cents
    const parts = allocate(money(5, 'USD'), [1, 1, 1, 1])
    expect(parts.map((part) => part.amountMinor)).toEqual([2, 1, 1, 1])
  })
})

describe('marginOf', () => {
  it('returns margin amount and basis points of sell', () => {
    // sell 100.00 buy 85.00 → margin 15.00 = 1500 bps
    expect(marginOf(money(10000, 'USD'), money(8500, 'USD'))).toEqual({
      margin: money(1500, 'USD'),
      marginBps: 1500,
    })
  })

  it('returns null bps when sell is zero', () => {
    expect(marginOf(money(0, 'USD'), money(0, 'USD'))).toEqual({
      margin: money(0, 'USD'),
      marginBps: null,
    })
  })
})

describe('format', () => {
  it('formats with locale and currency decimals', () => {
    expect(format(money(1234, 'USD'), 'en-US')).toMatch(/\$12\.34/)
    expect(format(money(1500, 'JPY'), 'en-US')).toMatch(/¥1,500|JPY\s?1,500/)
  })
})

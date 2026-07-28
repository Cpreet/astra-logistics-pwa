import { describe, expect, it } from 'vitest'
import { assertInquiryTransition, canTransitionInquiry } from '@/domain/inquiry-workflow'

describe('inquiry workflow', () => {
  it('allows new → qualified', () => {
    expect(canTransitionInquiry('new', 'qualified')).toBe(true)
  })

  it('blocks quoted → new', () => {
    expect(canTransitionInquiry('quoted', 'new')).toBe(false)
    expect(() => assertInquiryTransition('quoted', 'new')).toThrow()
  })

  it('allows quoted → converted', () => {
    expect(canTransitionInquiry('quoted', 'converted')).toBe(true)
  })
})

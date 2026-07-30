import { describe, expect, it } from 'vitest'
import {
  DEMO_LOGIN_PASSWORD,
  normalizeLoginEmail,
  validateDemoLogin,
  verifyDemoPassword,
} from '@/domain/demo-auth'

describe('demo auth', () => {
  it('normalizes email for lookup', () => {
    expect(normalizeLoginEmail('  Sales@Astra.Demo ')).toBe('sales@astra.demo')
  })

  it('accepts the shared demo password', () => {
    expect(verifyDemoPassword(DEMO_LOGIN_PASSWORD)).toBe(true)
    expect(verifyDemoPassword('wrong')).toBe(false)
  })

  it('returns actionable errors for bad credentials', () => {
    expect(validateDemoLogin('bad', { active: true })?.code).toBe('invalid_password')
    expect(validateDemoLogin(DEMO_LOGIN_PASSWORD, undefined)?.code).toBe('user_not_found')
    expect(validateDemoLogin(DEMO_LOGIN_PASSWORD, { active: true })).toBeNull()
  })
})

/**
 * Demo-only credentials for local sign-in. Not production authentication.
 * All seeded dummy accounts share one password for simplicity in demos.
 */
export const DEMO_LOGIN_PASSWORD = 'astra'

export function normalizeLoginEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function verifyDemoPassword(password: string): boolean {
  return password === DEMO_LOGIN_PASSWORD
}

export interface DemoLoginError {
  code: 'invalid_password' | 'user_not_found'
  message: string
}

export function validateDemoLogin(
  password: string,
  user: { active: boolean } | undefined,
): DemoLoginError | null {
  if (!verifyDemoPassword(password)) {
    return {
      code: 'invalid_password',
      message: `Incorrect password. Use "${DEMO_LOGIN_PASSWORD}" for all demo accounts.`,
    }
  }
  if (!user?.active) {
    return {
      code: 'user_not_found',
      message: 'No active demo account matches that email. Pick an account below or reload demo data.',
    }
  }
  return null
}

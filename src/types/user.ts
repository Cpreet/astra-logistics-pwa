export const USER_ROLES = [
  'administrator',
  'sales_executive',
  'pricing_executive',
  'operations_executive',
  'documentation_executive',
  'compliance_officer',
  'warehouse_executive',
  'finance_executive',
  'manager',
  'customer',
] as const

export type UserRole = (typeof USER_ROLES)[number]

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  avatarUrl?: string | null
  lastLoginAt?: string | null
}

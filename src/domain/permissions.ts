import type { UserRole } from '@/types/user'

export type Permission =
  | 'customers.read'
  | 'customers.write'
  | 'inquiries.read'
  | 'inquiries.write'
  | 'quotations.read'
  | 'quotations.write'
  | 'settings.manage'
  | 'sync.resolve'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  administrator: [
    'customers.read',
    'customers.write',
    'inquiries.read',
    'inquiries.write',
    'quotations.read',
    'quotations.write',
    'settings.manage',
    'sync.resolve',
  ],
  sales_executive: [
    'customers.read',
    'customers.write',
    'inquiries.read',
    'inquiries.write',
    'quotations.read',
    'quotations.write',
  ],
  pricing_executive: ['customers.read', 'inquiries.read', 'quotations.read', 'quotations.write'],
  operations_executive: ['customers.read', 'inquiries.read', 'inquiries.write', 'quotations.read'],
  documentation_executive: ['customers.read', 'inquiries.read'],
  compliance_officer: ['customers.read', 'inquiries.read'],
  warehouse_executive: ['customers.read', 'inquiries.read'],
  finance_executive: ['customers.read', 'inquiries.read', 'quotations.read'],
  manager: [
    'customers.read',
    'inquiries.read',
    'quotations.read',
    'quotations.write',
    'sync.resolve',
  ],
  customer: ['customers.read', 'inquiries.read'],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function formatRoleLabel(role: UserRole): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

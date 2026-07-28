import type { UserRole } from '@/types/user'

export interface RoleHome {
  headline: string
  focus: string
  primaryAction: { label: string; to: string } | null
}

const ROLE_HOME: Record<UserRole, RoleHome> = {
  administrator: {
    headline: 'Platform health',
    focus: 'Exceptions, sync integrity, and user access',
    primaryAction: { label: 'New inquiry', to: '/inquiries/new' },
  },
  sales_executive: {
    headline: 'Your pipeline',
    focus: 'Inquiries waiting on you and lanes at risk',
    primaryAction: { label: 'New inquiry', to: '/inquiries/new' },
  },
  pricing_executive: {
    headline: 'Pricing desk',
    focus: 'Lanes awaiting rates and margin review',
    primaryAction: { label: 'Review pricing queue', to: '/inquiries?view=pricing' },
  },
  operations_executive: {
    headline: 'Operations board',
    focus: 'Bookings to execute and lanes in motion',
    primaryAction: { label: 'Open air module', to: '/modules/air' },
  },
  documentation_executive: {
    headline: 'Documentation desk',
    focus: 'Missing paperwork and verification queue',
    primaryAction: null,
  },
  compliance_officer: {
    headline: 'Compliance queue',
    focus: 'Holds, screening reviews, and cargo checks',
    primaryAction: { label: 'Review customers', to: '/customers?view=compliance' },
  },
  warehouse_executive: {
    headline: 'Warehouse floor',
    focus: 'Cargo receipts and inspection tasks',
    primaryAction: null,
  },
  finance_executive: {
    headline: 'Finance overview',
    focus: 'Credit holds, invoicing, and margin leakage',
    primaryAction: { label: 'Review credit holds', to: '/customers?view=credit' },
  },
  manager: {
    headline: 'Management overview',
    focus: 'SLA risk, escalations, and team throughput',
    primaryAction: { label: 'New inquiry', to: '/inquiries/new' },
  },
  customer: {
    headline: 'Your shipments',
    focus: 'Tracking, documents, and invoices',
    primaryAction: null,
  },
}

export function getRoleHome(role: UserRole): RoleHome {
  return ROLE_HOME[role]
}

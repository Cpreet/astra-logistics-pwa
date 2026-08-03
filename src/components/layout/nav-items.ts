import { Database, FileText, LayoutDashboard, Plane, Receipt, Users } from 'lucide-react'
import type { Permission } from '@/domain/permissions'

export interface NavItem {
  to: string
  label: string
  shortLabel: string
  icon: typeof LayoutDashboard
  end?: boolean
  permission?: Permission
  group: 'work' | 'modules' | 'system'
  shortcut?: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: LayoutDashboard,
    end: true,
    group: 'work',
    shortcut: 'G D',
  },
  {
    to: '/inquiries',
    label: 'Inquiries',
    shortLabel: 'Inquiries',
    icon: FileText,
    permission: 'inquiries.read',
    group: 'work',
    shortcut: 'G I',
  },
  {
    to: '/customers',
    label: 'Customers',
    shortLabel: 'Customers',
    icon: Users,
    permission: 'customers.read',
    group: 'work',
    shortcut: 'G C',
  },
  {
    to: '/documents',
    label: 'Documents',
    shortLabel: 'Docs',
    icon: Receipt,
    group: 'work',
    shortcut: 'G O',
  },
  {
    to: '/modules/air',
    label: 'Air freight',
    shortLabel: 'Air',
    icon: Plane,
    group: 'modules',
    shortcut: 'G A',
  },
  {
    to: '/sync',
    label: 'Sync activity',
    shortLabel: 'Sync',
    icon: Database,
    group: 'system',
    shortcut: 'G S',
  },
]

export const GROUP_LABELS: Record<NavItem['group'], string> = {
  work: 'Work',
  modules: 'Modules',
  system: 'System',
}

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { QuickCreateSheet } from '@/components/layout/quick-create-sheet'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/utils/cn'

export function MobileTabBar() {
  const { can } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const canCreate = can('inquiries.write') || can('customers.write')

  const visible = NAV_ITEMS.filter((item) => !item.permission || can(item.permission)).slice(0, 4)
  const left = visible.slice(0, 2)
  const right = visible.slice(2, 4)

  const renderItem = (item: (typeof NAV_ITEMS)[number]) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-medium transition-colors',
          isActive ? 'text-brand' : 'text-faint',
        )
      }
    >
      <item.icon className="size-5" aria-hidden />
      <span>{item.shortLabel}</span>
    </NavLink>
  )

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="mx-auto flex max-w-lg items-stretch">
          {left.map(renderItem)}

          {canCreate ? (
            <div className="flex w-16 shrink-0 items-center justify-center">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                aria-label="Create"
                className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-brand text-on-brand shadow-pop transition-transform active:scale-95"
              >
                <Plus className="size-5" aria-hidden />
              </button>
            </div>
          ) : null}

          {right.map(renderItem)}
        </div>
      </nav>
      <QuickCreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

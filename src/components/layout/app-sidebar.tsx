import { Plane } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { GROUP_LABELS, NAV_ITEMS, type NavItem } from '@/components/layout/nav-items'
import { Kbd } from '@/components/ui/kbd'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/utils/cn'

export function AppSidebar() {
  const { can } = useAuth()
  const visible = NAV_ITEMS.filter((item) => !item.permission || can(item.permission))
  const groups = Object.keys(GROUP_LABELS) as NavItem['group'][]

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface md:flex md:flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand">
          <Plane className="size-4 text-on-brand" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold tracking-tight text-ink">ASTRA</span>
          <span className="block truncate text-[0.68rem] text-faint">Freight intelligence</span>
        </span>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-5 px-3 pb-4">
        {groups.map((group) => {
          const items = visible.filter((item) => item.group === group)
          if (items.length === 0) return null
          return (
            <div key={group}>
              <p className="px-2 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-faint">
                {GROUP_LABELS[group]}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'group flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-brand-soft text-brand'
                            : 'text-muted hover:bg-raised hover:text-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={cn('size-4 shrink-0', isActive ? 'text-brand' : 'text-faint')}
                            aria-hidden
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.shortcut ? (
                            <Kbd className="opacity-0 transition-opacity group-hover:opacity-100">
                              {item.shortcut}
                            </Kbd>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <p className="px-5 pb-5 text-[0.68rem] leading-relaxed text-faint">
        Offline-first workspace. Changes are saved locally and queued for sync.
      </p>
    </aside>
  )
}

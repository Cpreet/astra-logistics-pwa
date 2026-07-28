import { Bell, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { formatRoleLabel } from '@/domain/permissions'
import { useNotifications, useUnreadNotificationCount } from '@/hooks/use-notifications'
import { markNotificationRead } from '@/repositories/notification-repository'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/utils/cn'

const desktopNav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/customers', label: 'Customers' },
  { to: '/inquiries', label: 'Inquiries' },
  { to: '/modules/air', label: 'Air Freight' },
]

export function AppHeader() {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: unread = 0 } = useUnreadNotificationCount(user?.id)
  const { data: notifications = [] } = useNotifications(user?.id)

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:py-4">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-900 md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400 sm:text-xs">
            ASTRA
          </p>
          <h1 className="truncate text-base font-semibold text-white sm:text-lg">
            Freight Intelligence
          </h1>
        </div>

        {user ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative">
              <button
                type="button"
                className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-900"
                aria-label="Notifications"
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Bell className="size-5" />
                {unread > 0 ? (
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-sky-500" />
                ) : null}
              </button>
              {notifOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-xl">
                  <p className="px-2 py-1 text-xs font-medium text-slate-400">In-app notifications</p>
                  <ul className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <li className="px-2 py-3 text-sm text-slate-500">No notifications yet</li>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            className={cn(
                              'w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-900',
                              n.status === 'unread' ? 'text-slate-100' : 'text-slate-400',
                            )}
                            onClick={() => {
                              void markNotificationRead(n.id).then(() => {
                                void queryClient.invalidateQueries({ queryKey: ['notifications'] })
                              })
                            }}
                          >
                            <p className="font-medium">{n.title}</p>
                            <p className="text-xs text-slate-500">{n.message}</p>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="hidden min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-slate-300 hover:bg-slate-900 sm:inline-flex"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Sign in
          </Link>
        )}
      </div>

      <nav
        aria-label="Main"
        className={cn(
          'border-t border-slate-900 md:block',
          menuOpen ? 'block' : 'hidden md:block',
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-2 py-2 md:flex-row md:items-center md:gap-1 md:px-4 md:py-0">
          {desktopNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium transition md:py-2',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          {user ? (
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-900 px-1 py-2 md:ml-auto md:mt-0 md:border-0 md:py-3">
              <div className="min-w-0 text-right md:text-left">
                <p className="truncate text-sm font-medium text-slate-200">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{formatRoleLabel(user.role)}</p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-slate-300 hover:bg-slate-900 sm:hidden"
                onClick={() => void signOut()}
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  )
}

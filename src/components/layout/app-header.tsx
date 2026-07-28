import { Bell, Check, MoonStar, Search, Sun } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Kbd } from '@/components/ui/kbd'
import { useCommandPalette } from '@/features/command-palette/command-palette'
import { useAuth } from '@/features/auth/auth-context'
import { useTheme } from '@/features/theme/theme-context'
import { formatRoleLabel } from '@/domain/permissions'
import { useNotifications, useUnreadNotificationCount } from '@/hooks/use-notifications'
import { markNotificationRead } from '@/repositories/notification-repository'
import { UserMenu } from '@/components/layout/user-menu'
import { cn } from '@/utils/cn'

export function AppHeader() {
  const { user } = useAuth()
  const { open } = useCommandPalette()
  const { resolved, toggle } = useTheme()
  const [notifOpen, setNotifOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: unread = 0 } = useUnreadNotificationCount(user?.id)
  const { data: notifications = [] } = useNotifications(user?.id)

  const iconButton =
    'inline-flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink'

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="flex items-center gap-2 px-4 py-2.5 md:px-6">
        <div className="min-w-0 flex-1 md:hidden">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand">
            ASTRA
          </p>
          <p className="truncate text-sm font-semibold text-ink">
            {user ? formatRoleLabel(user.role) : 'Freight intelligence'}
          </p>
        </div>

        <button
          type="button"
          onClick={open}
          className="hidden min-h-9 flex-1 items-center gap-2 rounded-lg border border-line bg-canvas px-3 text-left text-sm text-faint transition-colors hover:border-line-strong md:flex md:max-w-sm"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="flex-1 truncate">Search or jump to…</span>
          <Kbd>⌘K</Kbd>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={open} className={cn(iconButton, 'md:hidden')} aria-label="Search">
            <Search className="size-5" aria-hidden />
          </button>

          <button
            type="button"
            onClick={toggle}
            className={iconButton}
            aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {resolved === 'dark' ? <Sun className="size-5" /> : <MoonStar className="size-5" />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((value) => !value)}
              className={iconButton}
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
              aria-expanded={notifOpen}
            >
              <Bell className="size-5" aria-hidden />
              {unread > 0 ? (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-brand ring-2 ring-surface" />
              ) : null}
            </button>

            {notifOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close notifications"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setNotifOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-overlay shadow-pop">
                  <p className="border-b border-line px-3 py-2 text-xs font-semibold text-muted">
                    Notifications
                  </p>
                  <ul className="max-h-72 overflow-y-auto p-1">
                    {notifications.length === 0 ? (
                      <li className="px-3 py-6 text-center text-sm text-muted">
                        You’re all caught up
                      </li>
                    ) : (
                      notifications.slice(0, 10).map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() =>
                              void markNotificationRead(item.id).then(() =>
                                queryClient.invalidateQueries({ queryKey: ['notifications'] }),
                              )
                            }
                            className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-raised"
                          >
                            {item.status === 'unread' ? (
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                            ) : (
                              <Check className="mt-1 size-3 shrink-0 text-faint" aria-hidden />
                            )}
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-ink">
                                {item.title}
                              </span>
                              <span className="block text-xs text-muted">{item.message}</span>
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </>
            ) : null}
          </div>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}

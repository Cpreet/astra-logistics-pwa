import { Database, LogOut, RefreshCw, UserCog } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'
import { reloadDemoData } from '@/db/seed'
import { formatRoleLabel } from '@/domain/permissions'
import { useAuth } from '@/features/auth/auth-context'

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  if (!user) return null

  const menuItem =
    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-raised'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-raised"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
          {initials(user.name)}
        </span>
        <span className="hidden min-w-0 pr-1 text-left lg:block">
          <span className="block truncate text-sm font-medium text-ink">{user.name}</span>
          <span className="block truncate text-[0.68rem] text-faint">
            {formatRoleLabel(user.role)}
          </span>
        </span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-xl border border-line bg-overlay p-1 shadow-pop">
            <div className="border-b border-line px-2.5 pb-2 pt-1.5">
              <p className="truncate text-sm font-medium text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
              <p className="mt-1 text-[0.68rem] text-faint">Demo session · this device only</p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                className={menuItem}
                onClick={() => {
                  setOpen(false)
                  navigate('/welcome')
                }}
              >
                <UserCog className="size-4 text-faint" aria-hidden />
                Switch role
              </button>
              <button
                type="button"
                className={menuItem}
                onClick={() => {
                  setOpen(false)
                  navigate('/sync')
                }}
              >
                <Database className="size-4 text-faint" aria-hidden />
                Sync activity
              </button>
              <button
                type="button"
                className={menuItem}
                onClick={async () => {
                  setOpen(false)
                  await reloadDemoData()
                  await queryClient.invalidateQueries()
                  notify({ tone: 'success', message: 'Demo data reloaded' })
                }}
              >
                <RefreshCw className="size-4 text-faint" aria-hidden />
                Reload demo data
              </button>
              <button
                type="button"
                className={menuItem}
                onClick={async () => {
                  setOpen(false)
                  await signOut()
                  navigate('/welcome', { replace: true })
                }}
              >
                <LogOut className="size-4 text-faint" aria-hidden />
                Sign out
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

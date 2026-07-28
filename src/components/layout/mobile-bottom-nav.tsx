import { Home, Plane, Users, FileText, LogIn } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/utils/cn'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/inquiries', label: 'Inquiries', icon: FileText },
  { to: '/modules/air', label: 'Air', icon: Plane },
]

export function MobileBottomNav() {
  const { user } = useAuth()

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition',
                  isActive ? 'text-sky-400' : 'text-slate-500',
                )
              }
            >
              <item.icon className="size-5" aria-hidden />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      {!user ? (
        <NavLink
          to="/login"
          className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400"
        >
          <LogIn className="size-3.5" />
          Sign in
        </NavLink>
      ) : null}
    </nav>
  )
}

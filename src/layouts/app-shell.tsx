import { NavLink, Outlet } from 'react-router-dom'
import { OfflineBanner } from '@/components/layout/offline-banner'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/modules/air', label: 'Air Freight' },
]

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
      <OfflineBanner />
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
              ASTRA
            </p>
            <h1 className="text-lg font-semibold text-white">
              AI-Powered Freight Intelligence
            </h1>
          </div>
          <nav aria-label="Main" className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-900 px-4 py-3 text-center text-xs text-slate-500">
        Offline-first MVP · IndexedDB via Dexie · Air module scaffold
      </footer>
    </div>
  )
}

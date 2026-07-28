import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/layout/app-header'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { OfflineBanner } from '@/components/layout/offline-banner'

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
      <OfflineBanner />
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 md:py-8 md:pb-8">
        <Outlet />
      </main>
      <footer className="hidden border-t border-slate-900 px-4 py-3 text-center text-xs text-slate-500 md:block">
        Offline-first · Dexie · Demo authentication only
      </footer>
      <MobileBottomNav />
    </div>
  )
}

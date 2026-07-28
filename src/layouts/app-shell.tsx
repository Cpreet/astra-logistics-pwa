import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { OfflineBanner } from '@/components/layout/offline-banner'
import { CommandPaletteProvider } from '@/features/command-palette/command-palette'
import { useAppShortcuts } from '@/hooks/use-app-shortcuts'

function ShellBody() {
  useAppShortcuts()

  return (
    <div className="flex min-h-dvh bg-canvas">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <AppHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-28 md:px-6 md:py-7 md:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}

export function AppShell() {
  return (
    <CommandPaletteProvider>
      <ShellBody />
    </CommandPaletteProvider>
  )
}

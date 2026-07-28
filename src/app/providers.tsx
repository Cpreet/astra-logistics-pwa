import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { ToastProvider } from '@/components/ui/toast'
import { bootstrapLocalDatabase } from '@/db/bootstrap'
import { AuthProvider } from '@/features/auth/auth-context'
import { ThemeProvider } from '@/features/theme/theme-context'
import { startSyncEngine } from '@/sync/sync-engine'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function BootScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      <div
        className="size-7 animate-spin rounded-full border-2 border-line-strong border-t-brand"
        aria-hidden
      />
      <p className="text-sm text-muted">{message}</p>
    </div>
  )
}

export function AppProviders() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stopSync: (() => void) | undefined

    void (async () => {
      try {
        await bootstrapLocalDatabase()
        stopSync = startSyncEngine()
        setReady(true)
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Failed to initialize the local database',
        )
      }
    })()

    return () => stopSync?.()
  }, [])

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-6">
        <div className="max-w-sm rounded-card border border-line bg-surface p-5 text-center">
          <p className="text-sm font-semibold text-danger">Local storage unavailable</p>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      {!ready ? (
        <BootScreen message="Preparing your offline workspace…" />
      ) : (
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      )}
    </ThemeProvider>
  )
}

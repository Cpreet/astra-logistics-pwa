import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { bootstrapLocalDatabase } from '@/db/bootstrap'
import { router } from '@/app/router'
import { AuthProvider } from '@/features/auth/auth-context'
import { startSyncEngine } from '@/sync/sync-engine'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

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
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to initialize local database')
      }
    })()

    return () => {
      stopSync?.()
    }
  }, [])

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 p-6 text-red-300">
        {error}
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-950 text-slate-300">
        <div
          className="size-8 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400"
          aria-hidden
        />
        <p className="text-sm">Initializing local database…</p>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}

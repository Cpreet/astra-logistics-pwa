import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div
          className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-brand"
          role="status"
          aria-label="Loading session"
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/welcome" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

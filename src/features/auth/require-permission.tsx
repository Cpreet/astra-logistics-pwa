import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import type { Permission } from '@/domain/permissions'

export function RequirePermission({
  permission,
  children,
  fallbackTo = '/',
}: {
  permission: Permission
  children: ReactNode
  fallbackTo?: string
}) {
  const { can } = useAuth()
  if (!can(permission)) {
    return <Navigate to={fallbackTo} replace />
  }
  return children
}

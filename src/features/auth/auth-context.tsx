import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { clearDemoSession, loadDemoSession, saveDemoSession } from '@/db/seed'
import { normalizeLoginEmail, validateDemoLogin } from '@/domain/demo-auth'
import { hasPermission, type Permission } from '@/domain/permissions'
import { getUserByEmail, getUserById, upsertUser } from '@/repositories/user-repository'
import type { User } from '@/types/user'
import { nowUtcIso } from '@/utils/time'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (user: User) => Promise<void>
  signInWithCredentials: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  can: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const session = await loadDemoSession()
        if (session) {
          const found = await getUserById(session.userId)
          if (found?.active) {
            setUser(found)
          } else {
            await clearDemoSession()
          }
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const signIn = useCallback(async (next: User) => {
    const withLogin: User = { ...next, lastLoginAt: nowUtcIso() }
    await upsertUser(withLogin)
    await saveDemoSession(withLogin.id)
    setUser(withLogin)
  }, [])

  const signOut = useCallback(async () => {
    await clearDemoSession()
    setUser(null)
  }, [])

  const signInWithCredentials = useCallback(async (email: string, password: string) => {
    const normalized = normalizeLoginEmail(email)
    const found = await getUserByEmail(normalized)
    const error = validateDemoLogin(password, found)
    if (error) {
      throw new Error(error.message)
    }
    await signIn(found!)
  }, [signIn])

  const can = useCallback(
    (permission: Permission) => {
      if (!user) return false
      return hasPermission(user.role, permission)
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signInWithCredentials,
      signOut,
      can,
    }),
    [user, loading, signIn, signInWithCredentials, signOut, can],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

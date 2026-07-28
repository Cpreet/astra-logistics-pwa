import { useQuery } from '@tanstack/react-query'
import { ShieldAlert } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_USERS } from '@/db/seed'
import { useAuth } from '@/features/auth/auth-context'
import { formatRoleLabel } from '@/domain/permissions'
import { listActiveUsers } from '@/repositories/user-repository'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const { user, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const { data: users = DEMO_USERS } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: listActiveUsers,
  })

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true })
    }
  }, [loading, user, navigate])

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">ASTRA</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Demo sign-in</h1>
          <p className="mt-2 text-sm text-slate-400">
            Not production authentication. Pick a seeded user to explore role-based workflows offline.
          </p>
        </div>

        <Card className="border-amber-900/40 bg-amber-950/20">
          <div className="flex gap-3">
            <ShieldAlert className="size-5 shrink-0 text-amber-400" aria-hidden />
            <div>
              <CardTitle className="text-base text-amber-100">Demo mode</CardTitle>
              <CardDescription className="text-amber-200/80">
                Sessions are stored in IndexedDB on this device only.
              </CardDescription>
            </div>
          </div>
        </Card>

        <ul className="space-y-2">
          {users.map((demoUser) => (
            <li key={demoUser.id}>
              <Button
                variant="secondary"
                className="h-auto min-h-14 w-full justify-between px-4 py-3 text-left"
                onClick={() => void signIn(demoUser).then(() => navigate('/'))}
              >
                <span>
                  <span className="block font-medium text-slate-100">{demoUser.name}</span>
                  <span className="block text-xs text-slate-400">{demoUser.email}</span>
                </span>
                <span className="text-xs text-slate-500">{formatRoleLabel(demoUser.role)}</span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

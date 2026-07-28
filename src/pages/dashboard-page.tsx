import { Plane, Database, Shield } from 'lucide-react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Operations overview</h2>
        <p className="mt-2 max-w-2xl text-slate-400">
          ASTRA is being built as a coherent freight ERP. This scaffold loads without a network,
          persists data in IndexedDB, and queues mutations for future synchronization.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <Plane className="mb-3 size-8 text-sky-400" aria-hidden />
          <CardTitle>Air freight first</CardTitle>
          <CardDescription>
            Domain model supports sea, road, rail, and courier — implementation starts with air
            workflows.
          </CardDescription>
        </Card>
        <Card>
          <Database className="mb-3 size-8 text-emerald-400" aria-hidden />
          <CardTitle>Local-first data</CardTitle>
          <CardDescription>
            Dexie stores operational data and a sync outbox. UI reads through repositories, not
            raw IndexedDB APIs.
          </CardDescription>
        </Card>
        <Card>
          <Shield className="mb-3 size-8 text-violet-400" aria-hidden />
          <CardTitle>Ready for roles</CardTitle>
          <CardDescription>
            Demo authentication and permission guards will arrive in the next phase — not
            production security.
          </CardDescription>
        </Card>
      </div>
    </div>
  )
}

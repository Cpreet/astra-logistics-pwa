import { format, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { useCustomers } from '@/hooks/use-customers'
import { useInquiries } from '@/hooks/use-inquiries'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { countPendingOutbox } from '@/repositories/sync-outbox-repository'
import { useQuery } from '@tanstack/react-query'
import { FileText, Users, Wifi, CloudUpload } from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()
  const online = useOnlineStatus()
  const { data: customers = [] } = useCustomers()
  const { data: inquiries = [] } = useInquiries()
  const { data: pendingSync = 0 } = useQuery({
    queryKey: ['sync', 'pending'],
    queryFn: countPendingOutbox,
    refetchInterval: 10_000,
  })

  const openInquiries = useMemo(
    () => inquiries.filter((i) => !['converted', 'lost', 'cancelled'].includes(i.status)).length,
    [inquiries],
  )

  const recentInquiries = inquiries.slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome${user ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Mobile-ready operations hub. Data is stored locally first and syncs when connectivity returns."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="p-4">
          <Users className="mb-2 size-5 text-sky-400" />
          <p className="text-2xl font-semibold text-white">{customers.length}</p>
          <CardDescription>Customers</CardDescription>
        </Card>
        <Card className="p-4">
          <FileText className="mb-2 size-5 text-violet-400" />
          <p className="text-2xl font-semibold text-white">{openInquiries}</p>
          <CardDescription>Open inquiries</CardDescription>
        </Card>
        <Card className="p-4">
          {online ? (
            <Wifi className="mb-2 size-5 text-emerald-400" />
          ) : (
            <CloudUpload className="mb-2 size-5 text-amber-400" />
          )}
          <p className="text-2xl font-semibold text-white">{online ? 'Online' : 'Offline'}</p>
          <CardDescription>{pendingSync} pending sync</CardDescription>
        </Card>
        <Card className="col-span-2 p-4 sm:col-span-1">
          <CardTitle className="text-base">Quick actions</CardTitle>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              to="/inquiries/new"
              className="min-h-11 rounded-lg bg-sky-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-sky-500"
            >
              New inquiry
            </Link>
            <Link
              to="/customers/new"
              className="min-h-11 rounded-lg border border-slate-700 px-3 py-2 text-center text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              Add customer
            </Link>
          </div>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Recent inquiries</h3>
          <Link to="/inquiries" className="text-sm text-sky-400 hover:underline">
            View all
          </Link>
        </div>
        <ul className="space-y-2">
          {recentInquiries.length === 0 ? (
            <li className="text-sm text-slate-500">No inquiries yet</li>
          ) : (
            recentInquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <Link
                  to={`/inquiries/${inquiry.id}`}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 active:bg-slate-900"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-100">{inquiry.inquiryNumber}</p>
                    <p className="truncate text-xs text-slate-500">
                      {inquiry.origin.code} → {inquiry.destination.code} ·{' '}
                      {format(parseISO(inquiry.createdAt), 'MMM d')}
                    </p>
                  </div>
                  <Badge variant="info">{inquiry.status.replaceAll('_', ' ')}</Badge>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}

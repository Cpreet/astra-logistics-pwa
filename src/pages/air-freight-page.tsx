import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { useInquiries } from '@/hooks/use-inquiries'
import { FileText, Users, Plane } from 'lucide-react'

export function AirFreightPage() {
  const { data: inquiries = [] } = useInquiries()
  const airInquiries = inquiries.filter((i) => i.transportMode === 'air')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Air freight"
        description="Commercial air workflow — inquiries today, quotations and bookings next."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/inquiries" className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 active:bg-slate-900">
          <Plane className="mb-2 size-6 text-sky-400" />
          <CardTitle className="text-base">Inquiries</CardTitle>
          <CardDescription>{airInquiries.length} air records</CardDescription>
        </Link>
        <Link to="/customers" className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 active:bg-slate-900">
          <Users className="mb-2 size-6 text-emerald-400" />
          <CardTitle className="text-base">Customers</CardTitle>
          <CardDescription>CRM & contacts</CardDescription>
        </Link>
        <Link to="/inquiries/new" className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 active:bg-slate-900">
          <FileText className="mb-2 size-6 text-violet-400" />
          <CardTitle className="text-base">New inquiry</CardTitle>
          <CardDescription>Capture lane & cargo</CardDescription>
        </Link>
      </div>

      <Card>
        <CardTitle>Coming next</CardTitle>
        <CardDescription className="mt-2">
          Quotations with margin approval, bookings, shipment state machine, documents, and finance —
          all offline-first with the same mobile shell.
        </CardDescription>
      </Card>
    </div>
  )
}

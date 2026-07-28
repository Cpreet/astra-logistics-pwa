import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export function AirFreightPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Air freight management</h2>
          <p className="mt-2 text-slate-400">
            Module placeholder — inquiries, quotations, bookings, and shipment lifecycle will
            connect here.
          </p>
        </div>
        <Button variant="secondary" disabled title="Available in a future iteration">
          New inquiry
        </Button>
      </div>
      <Card>
        <CardTitle>Next implementation steps</CardTitle>
        <CardDescription className="mt-3 space-y-2">
          <p>Customer CRM, quotation workflow, shipment state machine, documents, and finance.</p>
          <p>
            See{' '}
            <Link className="text-sky-400 underline-offset-2 hover:underline" to="/">
              dashboard
            </Link>{' '}
            and repository docs under <code className="text-slate-300">docs/</code>.
          </p>
        </CardDescription>
      </Card>
    </div>
  )
}

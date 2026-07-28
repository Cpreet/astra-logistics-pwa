import { ArrowRight, FileText, Package, Plane, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardDescription, CardTitle, SectionHeading } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCustomers } from '@/hooks/use-customers'
import { useInquiries } from '@/hooks/use-inquiries'

const ROADMAP = [
  { label: 'Inquiries', state: 'live' as const },
  { label: 'Quotations & margin approval', state: 'next' as const },
  { label: 'Bookings', state: 'next' as const },
  { label: 'Shipment lifecycle & tracking', state: 'planned' as const },
  { label: 'Documents & compliance', state: 'planned' as const },
  { label: 'Invoicing & profitability', state: 'planned' as const },
]

export function AirFreightPage() {
  const { data: inquiries = [] } = useInquiries()
  const { data: customers = [] } = useCustomers()
  const airInquiries = inquiries.filter((inquiry) => inquiry.transportMode === 'air')

  const shortcuts = [
    {
      to: '/inquiries',
      title: 'Air inquiries',
      description: `${airInquiries.length} lane request${airInquiries.length === 1 ? '' : 's'}`,
      icon: Plane,
    },
    {
      to: '/customers',
      title: 'Customers',
      description: `${customers.length} account${customers.length === 1 ? '' : 's'}`,
      icon: Users,
    },
    {
      to: '/inquiries/new',
      title: 'Capture a lane',
      description: 'Templates fill most fields',
      icon: FileText,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module"
        title="Air freight"
        description="The air workflow is built first; the domain model already covers sea, road, rail, and courier."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.to}
            to={shortcut.to}
            className="group rounded-card border border-line bg-surface p-4 shadow-card transition-colors hover:border-brand"
          >
            <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-brand-soft">
              <shortcut.icon className="size-4 text-brand" aria-hidden />
            </span>
            <CardTitle className="flex items-center gap-1 text-sm">
              {shortcut.title}
              <ArrowRight
                className="size-3.5 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                aria-hidden
              />
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">{shortcut.description}</CardDescription>
          </Link>
        ))}
      </div>

      <section aria-label="Module roadmap">
        <SectionHeading className="mb-2">Build order</SectionHeading>
        <Card>
          <ul className="space-y-2.5">
            {ROADMAP.map((item) => (
              <li key={item.label} className="flex items-center gap-3">
                <Package className="size-4 shrink-0 text-faint" aria-hidden />
                <span className="flex-1 text-sm text-ink">{item.label}</span>
                <Badge
                  tone={item.state === 'live' ? 'success' : item.state === 'next' ? 'brand' : 'neutral'}
                >
                  {item.state === 'live' ? 'Live' : item.state === 'next' ? 'Next' : 'Planned'}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  )
}

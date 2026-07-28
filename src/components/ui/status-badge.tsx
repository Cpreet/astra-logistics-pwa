import { Badge, Dot, type BadgeTone } from '@/components/ui/badge'
import type { CustomerStatus } from '@/types/customer'
import type { InquiryStatus } from '@/types/inquiry'
import type { SyncStatus } from '@/types/base'

const inquiryTones: Record<InquiryStatus, BadgeTone> = {
  new: 'info',
  qualified: 'brand',
  quotation_in_progress: 'warning',
  quoted: 'brand',
  converted: 'success',
  lost: 'danger',
  cancelled: 'neutral',
}

const customerTones: Record<CustomerStatus, BadgeTone> = {
  lead: 'info',
  active: 'success',
  credit_hold: 'danger',
  inactive: 'neutral',
}

const syncTones: Record<SyncStatus, BadgeTone> = {
  local: 'warning',
  pending: 'warning',
  syncing: 'info',
  synced: 'success',
  failed: 'danger',
  conflict: 'danger',
}

export function humanize(value: string): string {
  return value.replaceAll('_', ' ').replace(/^\w/, (c) => c.toUpperCase())
}

/** Operators scan lists quickly — keep pipeline labels short and industry-familiar. */
const inquiryLabels: Record<InquiryStatus, string> = {
  new: 'New',
  qualified: 'Qualified',
  quotation_in_progress: 'Pricing',
  quoted: 'Quoted',
  converted: 'Won',
  lost: 'Lost',
  cancelled: 'Cancelled',
}

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  const tone = inquiryTones[status]
  return (
    <Badge tone={tone}>
      <Dot tone={tone} />
      {inquiryLabels[status]}
    </Badge>
  )
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const tone = customerTones[status]
  return (
    <Badge tone={tone}>
      <Dot tone={tone} />
      {humanize(status)}
    </Badge>
  )
}

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  return <Badge tone={syncTones[status]}>{humanize(status)}</Badge>
}

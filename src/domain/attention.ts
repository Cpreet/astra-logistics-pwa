import { differenceInCalendarDays, differenceInHours } from 'date-fns'
import type { Customer } from '@/types/customer'
import type { Inquiry } from '@/types/inquiry'
import type { SyncOutboxEntry } from '@/types/base'

export type AttentionSeverity = 'critical' | 'high' | 'medium'

export interface AttentionItem {
  id: string
  severity: AttentionSeverity
  code: string
  title: string
  detail: string
  to: string
  actionLabel: string
}

const severityRank: Record<AttentionSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
}

interface AttentionInput {
  inquiries: Inquiry[]
  customers: Customer[]
  outbox: SyncOutboxEntry[]
  now?: Date
}

const OPEN_INQUIRY_STATUSES = new Set(['new', 'qualified', 'quotation_in_progress'])

/**
 * Exception-first: surface what threatens service or margin, not generic counts.
 */
export function buildAttentionQueue({
  inquiries,
  customers,
  outbox,
  now = new Date(),
}: AttentionInput): AttentionItem[] {
  const items: AttentionItem[] = []

  const failed = outbox.filter((entry) => entry.status === 'failed')
  if (failed.length > 0) {
    items.push({
      id: 'sync-failed',
      severity: 'critical',
      code: 'SYNC_FAILED',
      title: `${failed.length} change${failed.length === 1 ? '' : 's'} failed to sync`,
      detail: 'Local edits could not be pushed. Review and retry from the sync queue.',
      to: '/sync',
      actionLabel: 'Open sync queue',
    })
  }

  for (const customer of customers) {
    if (customer.status === 'credit_hold') {
      items.push({
        id: `credit-hold-${customer.id}`,
        severity: 'critical',
        code: 'CREDIT_HOLD',
        title: `${customer.legalName} is on credit hold`,
        detail: 'New bookings should not proceed until finance releases the account.',
        to: `/customers/${customer.id}`,
        actionLabel: 'Review customer',
      })
    } else if (customer.complianceStatus !== 'clear') {
      items.push({
        id: `compliance-${customer.id}`,
        severity: 'high',
        code: 'COMPLIANCE_REVIEW',
        title: `${customer.legalName} needs compliance review`,
        detail: `Compliance status is "${customer.complianceStatus}".`,
        to: `/customers/${customer.id}`,
        actionLabel: 'Review customer',
      })
    }
  }

  for (const inquiry of inquiries) {
    if (!OPEN_INQUIRY_STATUSES.has(inquiry.status)) continue

    if (inquiry.requestedPickupDate) {
      const daysToPickup = differenceInCalendarDays(new Date(inquiry.requestedPickupDate), now)
      if (daysToPickup < 0) {
        items.push({
          id: `pickup-passed-${inquiry.id}`,
          severity: 'critical',
          code: 'PICKUP_DATE_PASSED',
          title: `${inquiry.inquiryNumber} pickup date has passed`,
          detail: `Requested pickup was ${Math.abs(daysToPickup)} day(s) ago and the inquiry is still ${inquiry.status.replaceAll('_', ' ')}.`,
          to: `/inquiries/${inquiry.id}`,
          actionLabel: 'Open inquiry',
        })
        continue
      }
      if (daysToPickup <= 2 && inquiry.status !== 'quotation_in_progress') {
        items.push({
          id: `pickup-soon-${inquiry.id}`,
          severity: 'high',
          code: 'PICKUP_IMMINENT',
          title: `${inquiry.inquiryNumber} ships in ${daysToPickup} day(s)`,
          detail: 'Quote this lane now to protect the pickup window.',
          to: `/inquiries/${inquiry.id}`,
          actionLabel: 'Quote lane',
        })
        continue
      }
    }

    const ageHours = differenceInHours(now, new Date(inquiry.updatedAt))
    if (inquiry.status === 'quotation_in_progress' && ageHours >= 48) {
      items.push({
        id: `quote-stalled-${inquiry.id}`,
        severity: 'high',
        code: 'QUOTE_STALLED',
        title: `${inquiry.inquiryNumber} pricing stalled`,
        detail: `No pricing update for ${Math.floor(ageHours / 24)} day(s).`,
        to: `/inquiries/${inquiry.id}`,
        actionLabel: 'Resume pricing',
      })
    } else if (ageHours >= 72) {
      items.push({
        id: `inquiry-idle-${inquiry.id}`,
        severity: 'medium',
        code: 'INQUIRY_IDLE',
        title: `${inquiry.inquiryNumber} has had no activity`,
        detail: `Idle for ${Math.floor(ageHours / 24)} day(s) in ${inquiry.status.replaceAll('_', ' ')}.`,
        to: `/inquiries/${inquiry.id}`,
        actionLabel: 'Follow up',
      })
    }
  }

  return items.sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
}

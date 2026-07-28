import type { InquiryStatus } from '@/types/inquiry'

const ALLOWED: Record<InquiryStatus, InquiryStatus[]> = {
  new: ['qualified', 'quotation_in_progress', 'lost', 'cancelled'],
  qualified: ['quotation_in_progress', 'lost', 'cancelled'],
  quotation_in_progress: ['quoted', 'lost', 'cancelled'],
  quoted: ['converted', 'lost', 'cancelled'],
  converted: [],
  lost: [],
  cancelled: [],
}

export function canTransitionInquiry(from: InquiryStatus, to: InquiryStatus): boolean {
  if (from === to) return true
  return ALLOWED[from].includes(to)
}

export function assertInquiryTransition(from: InquiryStatus, to: InquiryStatus): void {
  if (!canTransitionInquiry(from, to)) {
    throw new Error(`Inquiry cannot move from ${from} to ${to}`)
  }
}

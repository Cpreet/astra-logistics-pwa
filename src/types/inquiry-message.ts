import type { BaseEntity } from '@/types/base'

export const INQUIRY_MESSAGE_CHANNELS = ['email', 'whatsapp'] as const
export type InquiryMessageChannel = (typeof INQUIRY_MESSAGE_CHANNELS)[number]

export const INQUIRY_MESSAGE_DIRECTIONS = ['outbound', 'inbound'] as const
export type InquiryMessageDirection = (typeof INQUIRY_MESSAGE_DIRECTIONS)[number]

export const INQUIRY_MESSAGE_STATUSES = [
  'draft',
  'queued',
  'sent',
  'failed',
  'received',
] as const
export type InquiryMessageStatus = (typeof INQUIRY_MESSAGE_STATUSES)[number]

/**
 * A single email or WhatsApp message tied to an inquiry.
 * Delivery is simulated in the MVP (`simulated: true`).
 */
export interface InquiryMessage extends BaseEntity {
  inquiryId: string
  customerId: string
  channel: InquiryMessageChannel
  direction: InquiryMessageDirection
  status: InquiryMessageStatus
  /** Email subject; null for WhatsApp. */
  subject?: string | null
  body: string
  /** Email address or E.164-ish phone for WhatsApp. */
  toAddress: string
  fromAddress?: string | null
  contactName?: string | null
  sentAt?: string | null
  templateId?: string | null
  simulated: true
}

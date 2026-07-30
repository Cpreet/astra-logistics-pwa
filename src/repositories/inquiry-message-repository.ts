import { db } from '@/db/astra-db'
import { persistCreate, persistUpdate } from '@/repositories/persist-entity'
import type {
  InquiryMessage,
  InquiryMessageChannel,
  InquiryMessageStatus,
} from '@/types/inquiry-message'
import { createBaseEntity, touchEntity } from '@/utils/entity'
import { nowUtcIso } from '@/utils/time'

export async function listMessagesForInquiry(inquiryId: string): Promise<InquiryMessage[]> {
  const rows = await db.inquiryMessages
    .where('inquiryId')
    .equals(inquiryId)
    .filter((message) => !message.deletedAt)
    .toArray()
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function getInquiryMessageById(id: string): Promise<InquiryMessage | undefined> {
  const message = await db.inquiryMessages.get(id)
  if (!message || message.deletedAt) return undefined
  return message
}

export interface CreateInquiryMessageInput {
  inquiryId: string
  customerId: string
  channel: InquiryMessageChannel
  subject?: string | null
  body: string
  toAddress: string
  fromAddress?: string | null
  contactName?: string | null
  templateId?: string | null
  /** When true, save as draft; otherwise queue for simulated send. */
  asDraft?: boolean
}

export async function createInquiryMessage(
  userId: string,
  input: CreateInquiryMessageInput,
): Promise<InquiryMessage> {
  const status: InquiryMessageStatus = input.asDraft === false ? 'queued' : 'draft'
  const message: InquiryMessage = {
    ...createBaseEntity(userId),
    inquiryId: input.inquiryId,
    customerId: input.customerId,
    channel: input.channel,
    direction: 'outbound',
    status,
    subject: input.channel === 'email' ? (input.subject ?? null) : null,
    body: input.body.trim(),
    toAddress: input.toAddress.trim(),
    fromAddress: input.fromAddress ?? (input.channel === 'email' ? 'sales@astra.demo' : null),
    contactName: input.contactName ?? null,
    sentAt: null,
    templateId: input.templateId ?? null,
    simulated: true,
  }

  if (!message.body) {
    throw new Error('Message body is required. Add a short note before saving.')
  }
  if (!message.toAddress) {
    throw new Error(
      input.channel === 'email'
        ? 'Add a recipient email before saving.'
        : 'Add a WhatsApp number before saving.',
    )
  }
  if (message.channel === 'email' && !message.subject?.trim()) {
    throw new Error('Email messages need a subject line.')
  }

  return persistCreate(db.inquiryMessages, 'inquiry_message', message, {
    userId,
    summary: `${message.channel} ${status} for inquiry ${message.inquiryId}`,
    metadata: { channel: message.channel, status },
  })
}

export async function updateInquiryMessageDraft(
  userId: string,
  messageId: string,
  patch: Pick<CreateInquiryMessageInput, 'subject' | 'body' | 'toAddress' | 'contactName'>,
): Promise<InquiryMessage> {
  const existing = await getInquiryMessageById(messageId)
  if (!existing) throw new Error('Message not found')
  if (existing.status !== 'draft') {
    throw new Error('Only draft messages can be edited. Create a new draft instead.')
  }

  const updated = touchEntity(
    {
      ...existing,
      subject: existing.channel === 'email' ? (patch.subject ?? existing.subject) : null,
      body: patch.body.trim(),
      toAddress: patch.toAddress.trim(),
      contactName: patch.contactName ?? existing.contactName,
    },
    userId,
  )

  if (!updated.body) throw new Error('Message body is required.')
  if (!updated.toAddress) throw new Error('Recipient is required.')

  return persistUpdate(db.inquiryMessages, 'inquiry_message', updated, {
    userId,
    summary: `Draft updated (${updated.channel})`,
  })
}

/**
 * Simulated send — marks the draft/queued message as sent locally.
 * No real email or WhatsApp provider is called.
 */
export async function sendInquiryMessage(
  userId: string,
  messageId: string,
): Promise<InquiryMessage> {
  const existing = await getInquiryMessageById(messageId)
  if (!existing) throw new Error('Message not found')
  if (!['draft', 'queued', 'failed'].includes(existing.status)) {
    throw new Error(`Cannot send a message in status "${existing.status}".`)
  }

  const updated = touchEntity(
    {
      ...existing,
      status: 'sent' as const,
      sentAt: nowUtcIso(),
      simulated: true as const,
    },
    userId,
  )

  return persistUpdate(db.inquiryMessages, 'inquiry_message', updated, {
    userId,
    summary: `Simulated ${updated.channel} send`,
    metadata: { simulated: true },
    reason: 'Simulated delivery — no external provider in MVP',
  })
}

/** Record a customer reply for the trail (demo / offline capture). */
export async function recordInboundInquiryMessage(
  userId: string,
  input: {
    inquiryId: string
    customerId: string
    channel: InquiryMessageChannel
    body: string
    fromAddress: string
    contactName?: string | null
    subject?: string | null
  },
): Promise<InquiryMessage> {
  const message: InquiryMessage = {
    ...createBaseEntity(userId),
    inquiryId: input.inquiryId,
    customerId: input.customerId,
    channel: input.channel,
    direction: 'inbound',
    status: 'received',
    subject: input.channel === 'email' ? (input.subject ?? null) : null,
    body: input.body.trim(),
    toAddress: input.channel === 'email' ? 'sales@astra.demo' : 'ASTRA Sales',
    fromAddress: input.fromAddress,
    contactName: input.contactName ?? null,
    sentAt: nowUtcIso(),
    templateId: null,
    simulated: true,
  }

  return persistCreate(db.inquiryMessages, 'inquiry_message', message, {
    userId,
    summary: `Inbound ${message.channel} logged`,
    metadata: { channel: message.channel, simulated: true },
  })
}

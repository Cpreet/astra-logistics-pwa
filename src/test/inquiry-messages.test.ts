import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/astra-db'
import { bootstrapLocalDatabase } from '@/db/bootstrap'
import { buildInquiryMessageTemplates } from '@/domain/inquiry-message-templates'
import {
  createInquiryMessage,
  listMessagesForInquiry,
  sendInquiryMessage,
} from '@/repositories/inquiry-message-repository'
import { listInquiries } from '@/repositories/inquiry-repository'

describe('inquiry message templates', () => {
  it('builds email and WhatsApp drafts from the inquiry lane', async () => {
    await db.close()
    await db.delete()
    await db.open()
    await bootstrapLocalDatabase()

    const [inquiry] = await listInquiries()
    expect(inquiry).toBeTruthy()
    const templates = buildInquiryMessageTemplates(inquiry!)
    expect(templates.some((t) => t.channel === 'email' && t.subject?.includes(inquiry!.inquiryNumber))).toBe(
      true,
    )
    expect(templates.some((t) => t.channel === 'whatsapp')).toBe(true)
  })
})

describe('inquiry message repository', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
    await db.open()
    await bootstrapLocalDatabase()
  })

  it('creates, lists and simulates a send against an inquiry', async () => {
    const [inquiry] = await listInquiries()
    expect(inquiry).toBeTruthy()

    const draft = await createInquiryMessage(inquiry!.assignedSalesUserId, {
      inquiryId: inquiry!.id,
      customerId: inquiry!.customerId,
      channel: 'email',
      subject: `Re: ${inquiry!.inquiryNumber}`,
      body: 'Please confirm pickup window.',
      toAddress: 'jordan@acmeaero.demo',
      contactName: 'Jordan Lee',
      asDraft: true,
    })

    expect(draft.status).toBe('draft')
    expect(draft.inquiryId).toBe(inquiry!.id)
    expect(draft.simulated).toBe(true)

    const sent = await sendInquiryMessage(inquiry!.assignedSalesUserId, draft.id)
    expect(sent.status).toBe('sent')
    expect(sent.sentAt).toBeTruthy()

    const trail = await listMessagesForInquiry(inquiry!.id)
    expect(trail.some((message) => message.id === draft.id)).toBe(true)
    expect(trail.every((message) => message.inquiryId === inquiry!.id)).toBe(true)
  })

  it('refuses an email without a subject', async () => {
    const [inquiry] = await listInquiries()
    await expect(
      createInquiryMessage(inquiry!.assignedSalesUserId, {
        inquiryId: inquiry!.id,
        customerId: inquiry!.customerId,
        channel: 'email',
        subject: '   ',
        body: 'Body text',
        toAddress: 'a@b.com',
        asDraft: true,
      }),
    ).rejects.toThrow(/subject/i)
  })

  it('opens schema v4 with inquiryMessages', async () => {
    expect(db.verno).toBeGreaterThanOrEqual(4)
    expect(db.inquiryMessages).toBeTruthy()
  })
})

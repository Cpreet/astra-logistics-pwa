import { db } from '@/db/astra-db'
import { assertInquiryTransition } from '@/domain/inquiry-workflow'
import type { Inquiry, InquiryStatus } from '@/types/inquiry'
import { persistCreate, persistUpdate } from '@/repositories/persist-entity'
import { createInAppNotification } from '@/services/notification-service'
import { createBaseEntity, touchEntity } from '@/utils/entity'

export async function listInquiries(): Promise<Inquiry[]> {
  const rows = await db.inquiries.filter((i) => !i.deletedAt).toArray()
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getInquiryById(id: string): Promise<Inquiry | undefined> {
  const inquiry = await db.inquiries.get(id)
  if (!inquiry || inquiry.deletedAt) return undefined
  return inquiry
}

export async function countInquiriesByStatus(): Promise<Record<string, number>> {
  const inquiries = await listInquiries()
  return inquiries.reduce<Record<string, number>>((acc, inquiry) => {
    acc[inquiry.status] = (acc[inquiry.status] ?? 0) + 1
    return acc
  }, {})
}

async function nextInquiryNumber(): Promise<string> {
  const count = await db.inquiries.count()
  return `INQ-${String(count + 1).padStart(5, '0')}`
}

export type CreateInquiryInput = Omit<
  Inquiry,
  | 'id'
  | 'inquiryNumber'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'version'
  | 'syncStatus'
  | 'deletedAt'
  | 'status'
>

export async function createInquiry(userId: string, input: CreateInquiryInput): Promise<Inquiry> {
  const inquiry: Inquiry = {
    ...createBaseEntity(userId),
    ...input,
    inquiryNumber: await nextInquiryNumber(),
    status: 'new',
  }

  await persistCreate(db.inquiries, 'inquiry', inquiry, {
    userId,
    summary: `Inquiry ${inquiry.inquiryNumber} created`,
  })

  await createInAppNotification({
    userId: input.assignedSalesUserId,
    customerId: input.customerId,
    shipmentId: null,
    title: 'New inquiry',
    message: `${inquiry.inquiryNumber} created for ${inquiry.origin.code} → ${inquiry.destination.code}`,
    severity: 'info',
  })

  return inquiry
}

export async function transitionInquiry(
  userId: string,
  inquiryId: string,
  toStatus: InquiryStatus,
): Promise<Inquiry> {
  const existing = await getInquiryById(inquiryId)
  if (!existing) {
    throw new Error('Inquiry not found')
  }
  assertInquiryTransition(existing.status, toStatus)
  const updated = touchEntity({ ...existing, status: toStatus }, userId)
  return persistUpdate(db.inquiries, 'inquiry', updated, {
    userId,
    summary: `Inquiry ${existing.inquiryNumber} → ${toStatus}`,
    metadata: { from: existing.status, to: toStatus },
  })
}

import { db } from '@/db/astra-db'
import type { Notification } from '@/types/notification'
import { createId } from '@/utils/id'
import { nowUtcIso } from '@/utils/time'

export async function createInAppNotification(
  input: Omit<Notification, 'id' | 'createdAt' | 'channel' | 'status' | 'readAt' | 'sentAt'>,
): Promise<Notification> {
  const notification: Notification = {
    id: createId(),
    channel: 'in_app',
    status: 'unread',
    createdAt: nowUtcIso(),
    readAt: null,
    sentAt: nowUtcIso(),
    failureReason: null,
    ...input,
  }
  await db.notifications.add(notification)
  return notification
}

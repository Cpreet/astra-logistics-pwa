import { db } from '@/db/astra-db'
import type { Notification } from '@/types/notification'
import { nowUtcIso } from '@/utils/time'

export async function listNotificationsForUser(userId: string): Promise<Notification[]> {
  const rows = await db.notifications.where('userId').equals(userId).toArray()
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  return db.notifications
    .where('userId')
    .equals(userId)
    .filter((n) => n.status === 'unread')
    .count()
}

export async function markNotificationRead(id: string): Promise<void> {
  const notification = await db.notifications.get(id)
  if (!notification) return
  await db.notifications.put({
    ...notification,
    status: 'read',
    readAt: nowUtcIso(),
  })
}

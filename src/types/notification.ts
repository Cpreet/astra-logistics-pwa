export const NOTIFICATION_CHANNELS = [
  'in_app',
  'email_simulated',
  'sms_simulated',
  'push_simulated',
] as const

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number]

export const NOTIFICATION_STATUSES = ['unread', 'read', 'failed'] as const
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number]

export interface Notification {
  id: string
  userId: string
  customerId?: string | null
  shipmentId?: string | null
  channel: NotificationChannel
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
  status: NotificationStatus
  createdAt: string
  readAt?: string | null
  sentAt?: string | null
  failureReason?: string | null
}

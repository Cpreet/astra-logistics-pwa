import { useQuery } from '@tanstack/react-query'
import {
  countUnreadNotifications,
  listNotificationsForUser,
} from '@/repositories/notification-repository'

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => listNotificationsForUser(userId!),
    enabled: Boolean(userId),
  })
}

export function useUnreadNotificationCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId, 'unread-count'],
    queryFn: () => countUnreadNotifications(userId!),
    enabled: Boolean(userId),
    refetchInterval: 15_000,
  })
}

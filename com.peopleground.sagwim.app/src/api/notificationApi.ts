import apiClient from '../lib/apiClient'
import type { PageResponse } from '../types/user'
import type {
  NotificationResponse,
  UnreadCountResponse,
  MarkAllReadResponse,
} from '../types/notification'

export const getNotifications = (page = 0, size = 20) =>
  apiClient
    .get<PageResponse<NotificationResponse>>('/notifications', { params: { page, size } })
    .then((r) => r.data)

export const getUnreadCount = () =>
  apiClient
    .get<UnreadCountResponse>('/notifications/unread-count')
    .then((r) => r.data)

export const markNotificationAsRead = (id: number) =>
  apiClient
    .patch<void>(`/notifications/${id}/read`)
    .then((r) => r.data)

export const markAllNotificationsAsRead = () =>
  apiClient
    .patch<MarkAllReadResponse>('/notifications/read-all')
    .then((r) => r.data)

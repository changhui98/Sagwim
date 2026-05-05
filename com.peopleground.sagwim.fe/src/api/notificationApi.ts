import type { PageResponse } from '../types/user'
import type {
  MarkAllReadResponse,
  NotificationResponse,
  UnreadCountResponse,
} from '../types/notification'
import { ApiError } from './ApiError'
import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'

/**
 * 내 알림 목록 (최신순 페이지네이션).
 */
export const getNotifications = (
  token: string,
  page = 0,
  size = 20,
): Promise<PageResponse<NotificationResponse>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return fetch(`${API_BASE_URL}/notifications?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PageResponse<NotificationResponse>>(res))
}

/**
 * 미읽음 알림 수.
 * 사이드바 배지에서 폴링으로 호출하므로 가벼운 인덱스 카운트만 수행한다.
 */
export const getUnreadCount = (token: string): Promise<UnreadCountResponse> => {
  return fetch(`${API_BASE_URL}/notifications/unread-count`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<UnreadCountResponse>(res))
}

/**
 * 단일 알림 읽음 처리. 본인의 알림만 가능.
 */
export const markNotificationAsRead = (
  token: string,
  notificationId: number,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
  }).then((res) => {
    if (!res.ok) {
      return res.text().then((text) => {
        throw new ApiError(res.status, text || `Request failed: ${res.status}`)
      })
    }
  })
}

/**
 * 내 모든 미읽음 알림 일괄 읽음 처리.
 */
export const markAllNotificationsAsRead = (
  token: string,
): Promise<MarkAllReadResponse> => {
  return fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<MarkAllReadResponse>(res))
}

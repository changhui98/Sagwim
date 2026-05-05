/**
 * 알림 도메인 타입.
 *
 * 백엔드 NotificationType 과 1:1 대응한다 (com.peopleground.sagwim.notification.domain.entity.NotificationType).
 */
export type NotificationType =
  | 'CONTENT_LIKED'
  | 'COMMENT_ADDED'
  | 'MEETING_MEMBER_JOINED'
  | 'MEETING_SCHEDULE_ADDED'

export interface NotificationResponse {
  id: number
  type: NotificationType
  actorNickname: string
  actorProfileImageUrl: string | null
  targetId: number | null
  targetTitle: string | null
  read: boolean
  createdDate: string
}

export interface UnreadCountResponse {
  count: number
}

export interface MarkAllReadResponse {
  updated: number
}

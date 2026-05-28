export type NotificationType =
  | 'CONTENT_LIKED'
  | 'COMMENT_LIKED'
  | 'COMMENT_ADDED'
  | 'MEETING_MEMBER_JOINED'
  | 'MEETING_SCHEDULE_ADDED'
  | 'MEETING_LIKED'
  | 'MEETING_JOIN_REQUESTED'

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

export type GroupCategory = 'CLUB' | 'STUDY' | 'SOCIAL'
export type GroupMemberRole = 'LEADER' | 'MEMBER'
export type GroupMeetingType = 'ONLINE' | 'OFFLINE'
export type GroupStatus = 'PENDING' | 'ACTIVE' | 'REJECTED'
export type GroupJoinType = 'OPEN' | 'APPROVAL_REQUIRED'
export type GroupJoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface GroupJoinRequestResponse {
  requestId: number
  username: string
  nickname: string
  status: GroupJoinRequestStatus
  createdDate: string
  answer?: string | null
}

export interface GroupResponse {
  id: number
  name: string
  description: string | null
  category: GroupCategory
  meetingType: GroupMeetingType
  region: string | null
  maxMemberCount: number
  currentMemberCount: number
  leaderNickname: string
  leaderUsername: string
  createdDate: string
  imageUrl: string | null
  likeCount: number
  status: GroupStatus
}

export interface AdminGroupResponse {
  id: number
  name: string
  description: string | null
  category: GroupCategory
  meetingType: GroupMeetingType
  region: string | null
  maxMemberCount: number
  currentMemberCount: number
  leaderNickname: string
  leaderUsername: string
  status: GroupStatus
  createdDate: string
  lastModifiedDate: string | null
}

export const GROUP_STATUS_LABELS: Record<GroupStatus, string> = {
  PENDING: '승인 대기중',
  ACTIVE: '활성',
  REJECTED: '거절됨',
}

export interface GroupSearchParams {
  keyword?: string
  category?: GroupCategory | ''
}

export interface GroupMemberResponse {
  userId: string
  nickname: string
  username: string
  role: GroupMemberRole
  joinedAt: string
}

export interface GroupDetailResponse extends GroupResponse {
  status: GroupStatus
  joinType: GroupJoinType
  joinQuestions?: string[]
  members: GroupMemberResponse[]
}

export interface GroupCreateRequest {
  name: string
  description: string
  category: GroupCategory
  meetingType: GroupMeetingType
  region: string | null
  maxMemberCount: number
}

export const GROUP_CATEGORY_LABELS: Record<GroupCategory, string> = {
  CLUB: '동아리',
  STUDY: '스터디',
  SOCIAL: '소셜',
}

export const GROUP_MEETING_TYPE_LABELS: Record<GroupMeetingType, string> = {
  ONLINE: '온라인',
  OFFLINE: '오프라인',
}

export interface ScheduleResponse {
  id: number
  title: string
  startAt: string
  endAt: string
  location: string | null
  description: string | null
  createdByUsername: string
  createdByNickname: string
}

export interface ScheduleCreateRequest {
  title: string
  startAt: string
  endAt: string
  location?: string
  description?: string
}

export interface PlaceSuggestionResponse {
  placeId: string
  primaryText: string
  secondaryText: string
  fullAddress: string
}

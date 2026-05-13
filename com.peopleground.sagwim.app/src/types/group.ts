export type GroupCategory =
  | 'SPORTS'
  | 'CULTURE'
  | 'FOOD'
  | 'GAME'
  | 'STUDY'
  | 'HOBBY'
  | 'MUSIC'
  | 'TRAVEL'
  | 'PET'
  | 'VOLUNTEER'
  | 'BUSINESS'
  | 'LIFESTYLE'
  | 'SOCIAL'

export type GroupMeetingType = 'ONLINE' | 'OFFLINE'
export type GroupStatus = 'PENDING' | 'ACTIVE' | 'REJECTED'
export type GroupJoinType = 'OPEN' | 'APPROVAL_REQUIRED'

export interface GroupResponse {
  id: number
  name: string
  description: string | null
  category: GroupCategory
  subCategories: string[]
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
  isLiked: boolean
}

export const GROUP_CATEGORY_LABELS: Record<GroupCategory, string> = {
  SPORTS:    '🏃 운동 · 스포츠',
  CULTURE:   '🎬 관람 · 문화',
  FOOD:      '🍽️ 먹거리 · 음주',
  GAME:      '🎮 게임 · 오락',
  STUDY:     '📖 학습 · 자기계발',
  HOBBY:     '🎨 취미 · 공예',
  MUSIC:     '🎸 음악',
  TRAVEL:    '✈️ 여행 · 나들이',
  PET:       '🐶 반려동물',
  VOLUNTEER: '🤝 봉사 · 사회참여',
  BUSINESS:  '💼 비즈니스 · 네트워킹',
  LIFESTYLE: '💗 라이프스타일',
  SOCIAL:    '🫶 친목 · 소셜',
}

export const GROUP_MEETING_TYPE_LABELS: Record<GroupMeetingType, string> = {
  ONLINE: '온라인',
  OFFLINE: '오프라인',
}

export const GROUP_STATUS_LABELS: Record<GroupStatus, string> = {
  PENDING: '승인 대기중',
  ACTIVE: '활성',
  REJECTED: '거절됨',
}

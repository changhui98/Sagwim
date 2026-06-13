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

export const GROUP_SUB_CATEGORY_MAP: Record<GroupCategory, string[]> = {
  SPORTS: [
    '🏃‍♀️ 러닝 / 마라톤', '💪 헬스 / 웨이트', '🧘‍♀️ 요가 / 필라테스', '🥾 등산 / 트레킹',
    '🚴 자전거 / 라이딩', '🏊 수영', '🧗 클라이밍 / 볼더링', '⛳ 골프 / 스크린골프',
    '🎾 테니스', '🏸 배드민턴', '🏓 탁구', '⚽ 축구 / 풋살', '🏀 농구', '⚾ 야구',
    '🏐 배구', '🎳 볼링', '🎱 당구', '🥊 복싱 / 격투기', '💃 댄스',
    '🏄 서핑 / 패들보드', '🎿 스키 / 스노보드', '⛸️ 스케이트', '🎣 낚시',
  ],
  CULTURE: [
    '🎬 영화 관람', '🏟️ 스포츠 경기 관람', '🎭 뮤지컬 / 연극',
    '🎤 콘서트 / 페스티벌', '🖼️ 전시회 / 미술관', '🏛️ 박물관 / 고궁',
  ],
  FOOD: [
    '🍽️ 맛집 탐방', '☕ 카페 투어', '🍰 디저트', '🥐 브런치',
    '🍷 와인', '🍺 맥주 / 펍', '🥂 술자리 / 호프', '🍸 칵테일 / 바',
    '🍶 전통주', '🧋 차 / 티 클래스',
  ],
  GAME: [
    '🖥️ PC방', '🎮 콘솔게임', '🎲 보드게임', '🃏 카드게임 / TCG',
    '🥽 VR방', '🎤 노래방 / 코노', '🔐 방탈출', '📚 만화카페', '🎯 다트',
  ],
  STUDY: [
    '📖 독서 / 책 모임', '📚 스터디', '🗣️ 어학 (영어/일본어/중국어 등)',
    '💻 코딩 / 개발', '✍️ 글쓰기', '🎓 강의 / 세미나', '💡 토론',
  ],
  HOBBY: [
    '📷 사진 / 출사', '🎨 그림 / 드로잉', '🖌️ 캘리그라피', '🏺 도자기 / 도예',
    '🧶 뜨개질 / 자수', '💐 플라워 클래스', '🧁 베이킹', '🍳 쿠킹 클래스',
    '🔨 목공 / DIY', '🕯️ 향초 / 디퓨저', '🧴 비누 / 화장품 만들기',
  ],
  MUSIC: [
    '🎸 기타 / 밴드', '🎹 피아노', '🥁 드럼', '🎤 보컬 / 합창',
    '🎻 클래식 / 오케스트라', '🎧 DJ / 일렉트로닉',
  ],
  TRAVEL: [
    '🗺️ 국내여행', '✈️ 해외여행', '⛺ 캠핑 / 백패킹',
    '🚗 차박 / 드라이브', '🧺 피크닉', '🚶 동네 산책',
  ],
  PET: [
    '🐶 강아지 모임 (멍친구)', '🐱 고양이 모임 (집사 모임)', '🐠 수족관 / 아쿠아리움',
  ],
  VOLUNTEER: [
    '🤝 봉사활동', '🌱 환경 / 플로깅', '🐕 유기동물 보호', '❤️ 헌혈 / 기부',
  ],
  BUSINESS: [
    '💼 직장인 / 직무 모임', '🚀 창업 / 사이드프로젝트', '📈 주식 / 투자',
    '🪙 부동산', '🤖 AI / IT 트렌드',
  ],
  LIFESTYLE: [
    '🧘 명상 / 마음챙김', '👗 패션 / 쇼핑', '💄 뷰티', '🛏️ 인테리어 / 홈꾸미기',
    '🌿 식물 / 가드닝', '🚭 금연 / 금주 챌린지', '🥗 다이어트 / 식단',
  ],
  SOCIAL: [
    '🍻 동네 친구 만들기', '👥 또래 모임 (20대/30대 등)', '🌍 외국인 친구 / 언어교환',
    '💑 솔로 모임', '👨‍👩‍👧 육아 / 맘 모임',
  ],
}
export type GroupMemberRole = 'LEADER' | 'SUB_LEADER' | 'MEMBER'
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
  profileImageUrl: string | null
}

export interface GroupDetailResponse extends GroupResponse {
  status: GroupStatus
  joinType: GroupJoinType
  joinQuestions?: string[]
}

export interface GroupCreateRequest {
  name: string
  description: string
  category: GroupCategory
  subCategories?: string[]
  meetingType: GroupMeetingType
  maxMemberCount: number
  joinType?: GroupJoinType
  joinQuestions?: string[]
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

export interface ScheduleResponse {
  id: number
  title: string
  startAt: string
  endAt: string
  location: string | null
  description: string | null
  createdByUsername: string
  createdByNickname: string
  attendeeCount: number
  attendingByMe: boolean
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

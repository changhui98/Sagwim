export type SearchTargetType = 'USER' | 'POST' | 'GROUP'

/**
 * 최근 검색 기록 한 건.
 * 백엔드 com.peopleground.sagwim.search.presentation.dto.response.SearchHistoryResponse 와 1:1 매핑.
 *
 * - type 'USER': targetId 는 username, label 은 닉네임, profileImageUrl 은 프로필 이미지
 * - type 'POST': targetId 는 게시글 id, label 은 본문
 * - type 'GROUP': targetId 는 모임 id, label 은 모임 이름
 */
export interface SearchHistoryResponse {
  type: SearchTargetType
  targetId: string
  label: string
  profileImageUrl: string | null
}

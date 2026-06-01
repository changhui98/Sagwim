/**
 * "내 활동" 통합 좋아요 활동 한 건.
 * 백엔드 com.peopleground.sagwim.user.presentation.dto.response.LikedActivityResponse 와 1:1 매핑.
 *
 * - type 'POST': targetId 는 게시글 id, label 은 게시글 본문
 * - type 'GROUP': targetId 는 모임 id, label 은 모임 이름
 */
export interface LikedActivityResponse {
  type: 'POST' | 'GROUP'
  targetId: number
  label: string
}

/**
 * Spring Boot PageResponse 응답 래퍼.
 * 백엔드 com.peopleground.sagwim.global.dto.PageResponse 와 1:1 매핑.
 */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

/** 관리자 FAQ 목록/상세 응답 (노출 여부·정렬순서 포함) */
export interface AdminFaqResponse {
  id: number
  question: string
  answer: string
  displayOrder: number
  published: boolean
  createdDate: string
}

/** FAQ 등록/수정 요청 본문 */
export interface FaqRequest {
  question: string
  answer: string
  displayOrder: number
  published: boolean
}

/** 클라이언트 공개 FAQ 응답 */
export interface FaqResponse {
  id: number
  question: string
  answer: string
}

import type { FaqResponse } from '../types/faq'
import { API_BASE_URL } from './config'
import { parseResponse } from './apiUtils'

/**
 * 공개 FAQ 목록 조회.
 * 비로그인 사용자도 접근 가능하므로 Authorization 헤더를 보내지 않는다.
 * (백엔드 SecurityConfig 에서 GET /api/v1/faqs 는 permitAll)
 */
export const getFaqs = (): Promise<FaqResponse[]> => {
  return fetch(`${API_BASE_URL}/faqs`, {
    headers: { 'Content-Type': 'application/json' },
  }).then((response) => parseResponse<FaqResponse[]>(response))
}

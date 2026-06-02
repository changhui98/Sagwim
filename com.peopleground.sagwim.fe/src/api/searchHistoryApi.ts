import type { SearchHistoryResponse, SearchTargetType } from '../types/searchHistory'
import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'

/**
 * 검색 결과에서 상세로 진입한 항목을 최근 검색 기록에 저장한다.
 * POST /api/v1/users/me/search-history
 */
export const saveSearchHistory = (
  token: string,
  type: SearchTargetType,
  targetId: string,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/users/me/search-history`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ type, targetId }),
  }).then(() => undefined)
}

/**
 * 최근 검색 기록을 최근 본 순으로 조회한다.
 * GET /api/v1/users/me/search-history
 */
export const getSearchHistory = (token: string): Promise<SearchHistoryResponse[]> => {
  return fetch(`${API_BASE_URL}/users/me/search-history`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<SearchHistoryResponse[]>(res))
}

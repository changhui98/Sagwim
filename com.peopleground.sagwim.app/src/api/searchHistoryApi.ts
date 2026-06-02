import apiClient from '../lib/apiClient'
import type { SearchHistoryResponse, SearchTargetType } from '../types/searchHistory'

/**
 * 검색 결과에서 상세로 진입한 항목을 최근 검색 기록에 저장한다.
 * POST /users/me/search-history
 */
export const saveSearchHistory = async (
  type: SearchTargetType,
  targetId: string,
): Promise<void> => {
  await apiClient.post('/users/me/search-history', { type, targetId })
}

/**
 * 최근 검색 기록을 최근 본 순으로 조회한다.
 * GET /users/me/search-history
 */
export const getSearchHistory = async (): Promise<SearchHistoryResponse[]> => {
  const response = await apiClient.get<SearchHistoryResponse[]>('/users/me/search-history')
  return response.data
}

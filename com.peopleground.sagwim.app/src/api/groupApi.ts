import apiClient from '../lib/apiClient'
import type { GroupResponse } from '../types/group'
import type { PageResponse } from '../types/page'

/**
 * 생성된 지 7일 미만인 신규 모임 목록 조회.
 * 백엔드에서 기준 날짜 필터링을 처리합니다.
 */
export const getNewGroups = async (
  page = 0,
  size = 20,
): Promise<PageResponse<GroupResponse>> => {
  const response = await apiClient.get<PageResponse<GroupResponse>>('/groups/recent', {
    params: { page, size },
  })
  return response.data
}

/**
 * 좋아요 수 내림차순으로 인기 모임 목록 조회.
 */
export const getPopularGroups = async (
  page = 0,
  size = 20,
): Promise<PageResponse<GroupResponse>> => {
  const response = await apiClient.get<PageResponse<GroupResponse>>('/groups/popular', {
    params: { page, size },
  })
  return response.data
}

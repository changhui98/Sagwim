import apiClient from '../lib/apiClient'
import type { ContentResponse } from '../types/post'
import type { LikedActivityResponse } from '../types/activity'
import type { PageResponse } from '../types/page'

export const getLikedPosts = async (
  page = 0,
  size = 10,
): Promise<PageResponse<ContentResponse>> => {
  const response = await apiClient.get<PageResponse<ContentResponse>>(
    '/users/me/activity/liked-posts',
    { params: { page, size } },
  )
  return response.data
}

/**
 * 내가 좋아요를 누른 게시글·모임을 좋아요 시각 기준으로 통합 조회.
 * GET /users/me/activity/likes
 */
export const getLikedActivities = async (
  page = 0,
  size = 10,
): Promise<PageResponse<LikedActivityResponse>> => {
  const response = await apiClient.get<PageResponse<LikedActivityResponse>>(
    '/users/me/activity/likes',
    { params: { page, size } },
  )
  return response.data
}

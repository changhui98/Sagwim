import apiClient from '../lib/apiClient'
import type { ContentResponse } from '../types/post'
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

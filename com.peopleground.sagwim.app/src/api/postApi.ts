import apiClient from '../lib/apiClient'
import type { ContentResponse } from '../types/post'
import type { PageResponse } from '../types/page'

export const getPosts = async (
  page = 0,
  size = 12,
): Promise<PageResponse<ContentResponse>> => {
  const response = await apiClient.get<PageResponse<ContentResponse>>('/contents', {
    params: { page, size },
  })
  return response.data
}

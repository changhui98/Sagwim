import type { PageResponse } from '../types/user'
import type { ContentResponse } from '../types/post'
import type { GroupResponse } from '../types/group'
import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'

/**
 * 내가 좋아요를 누른 게시글 목록 조회.
 * GET /api/v1/users/me/activity/liked-posts
 */
export const getLikedPosts = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<ContentResponse>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return fetch(`${API_BASE_URL}/users/me/activity/liked-posts?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PageResponse<ContentResponse>>(res))
}

/**
 * 내가 좋아요를 누른 모임 목록 조회.
 * GET /api/v1/users/me/activity/liked-groups
 */
export const getLikedGroups = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<GroupResponse>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return fetch(`${API_BASE_URL}/users/me/activity/liked-groups?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PageResponse<GroupResponse>>(res))
}

/**
 * 내가 댓글을 작성한 게시글 목록 조회.
 * GET /api/v1/users/me/activity/commented-posts
 */
export const getCommentedPosts = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<ContentResponse>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return fetch(`${API_BASE_URL}/users/me/activity/commented-posts?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PageResponse<ContentResponse>>(res))
}

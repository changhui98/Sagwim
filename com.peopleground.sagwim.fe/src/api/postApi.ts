import type { PageResponse } from '../types/user'
import type {
  ContentResponse,
  CreateContentRequest,
  LikeToggleResponse,
} from '../types/post'
import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'

export const getPosts = (
  token: string,
  page = 0,
  size = 12,
  keyword = '',
  searchType: 'TITLE' | 'USERNAME' = 'TITLE',
): Promise<PageResponse<ContentResponse>> => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  if (keyword.trim()) {
    params.set('keyword', keyword.trim())
    params.set('searchType', searchType)
  }

  return fetch(`${API_BASE_URL}/contents?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<ContentResponse>>(response))
}

export const createPost = (
  token: string,
  data: CreateContentRequest,
): Promise<ContentResponse> => {
  return fetch(`${API_BASE_URL}/contents`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify(data),
  }).then((response) => parseResponse<ContentResponse>(response))
}

export const toggleContentLike = (
  token: string,
  contentId: number,
): Promise<LikeToggleResponse> => {
  return fetch(`${API_BASE_URL}/contents/${contentId}/likes`, {
    method: 'POST',
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<LikeToggleResponse>(response))
}

export const getMyPosts = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<ContentResponse>> => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  return fetch(`${API_BASE_URL}/contents/me?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<ContentResponse>>(response))
}

export const getUserPosts = (
  token: string,
  username: string,
  page = 0,
  size = 10,
): Promise<PageResponse<ContentResponse>> => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  return fetch(`${API_BASE_URL}/contents/users/${encodeURIComponent(username)}?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<ContentResponse>>(response))
}

export const getPost = (
  token: string,
  contentId: number,
): Promise<ContentResponse> => {
  return fetch(`${API_BASE_URL}/contents/${contentId}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<ContentResponse>(response))
}

export const updatePost = (
  token: string,
  contentId: number,
  body: string,
  tags?: string[],
): Promise<ContentResponse> => {
  return fetch(`${API_BASE_URL}/contents/${contentId}`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ body, tags }),
  }).then((response) => parseResponse<ContentResponse>(response))
}

export const deletePost = (
  token: string,
  contentId: number,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/contents/${contentId}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
  }).then((response) => {
    if (!response.ok) throw new Error('삭제 실패')
  })
}

/**
 * 특정 모임에 속한 게시글 목록을 조회한다.
 * GET /api/v1/contents/groups/{groupId}
 */
export const getGroupPosts = (
  token: string,
  groupId: number,
  page = 0,
  size = 10,
): Promise<PageResponse<ContentResponse>> => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  return fetch(`${API_BASE_URL}/contents/groups/${groupId}?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<ContentResponse>>(response))
}

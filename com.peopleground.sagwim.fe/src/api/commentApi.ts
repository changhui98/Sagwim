import type { CommentListResponse, CommentResponse } from '../types/comment'
import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'

export const getComments = (
  token: string,
  contentId: number,
  cursorId?: number,
  size = 20,
): Promise<CommentListResponse> => {
  const params = new URLSearchParams({ size: String(size) })
  if (cursorId !== undefined) {
    params.set('cursorId', String(cursorId))
  }

  return fetch(`${API_BASE_URL}/contents/${contentId}/comments?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<CommentListResponse>(response))
}

export const createComment = (
  token: string,
  contentId: number,
  body: string,
): Promise<CommentResponse> => {
  return fetch(`${API_BASE_URL}/contents/${contentId}/comments`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ body }),
  }).then((response) => parseResponse<CommentResponse>(response))
}

export const createReply = (
  token: string,
  contentId: number,
  commentId: number,
  body: string,
): Promise<CommentResponse> => {
  return fetch(`${API_BASE_URL}/contents/${contentId}/comments/${commentId}/replies`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ body }),
  }).then((response) => parseResponse<CommentResponse>(response))
}

export const deleteComment = (
  token: string,
  contentId: number,
  commentId: number,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/contents/${contentId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
  }).then((response) => {
    if (!response.ok) {
      return parseResponse<void>(response)
    }
  })
}

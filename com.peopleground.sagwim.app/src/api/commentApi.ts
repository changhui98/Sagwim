import apiClient from '../lib/apiClient'
import type { CommentListResponse, CommentResponse } from '../types/comment'

export const getComments = async (
  contentId: number,
  cursorId?: number,
  size = 20,
): Promise<CommentListResponse> => {
  const params: Record<string, string> = { size: String(size) }
  if (cursorId !== undefined) params.cursorId = String(cursorId)
  const response = await apiClient.get<CommentListResponse>(
    `/contents/${contentId}/comments`,
    { params },
  )
  return response.data
}

export const createComment = async (
  contentId: number,
  body: string,
): Promise<CommentResponse> => {
  const response = await apiClient.post<CommentResponse>(
    `/contents/${contentId}/comments`,
    { body },
  )
  return response.data
}

export const createReply = async (
  contentId: number,
  commentId: number,
  body: string,
): Promise<CommentResponse> => {
  const response = await apiClient.post<CommentResponse>(
    `/contents/${contentId}/comments/${commentId}/replies`,
    { body },
  )
  return response.data
}

export const deleteComment = async (
  contentId: number,
  commentId: number,
): Promise<void> => {
  await apiClient.delete(`/contents/${contentId}/comments/${commentId}`)
}

export const toggleCommentLike = async (
  commentId: number,
): Promise<{ liked: boolean; likeCount: number }> => {
  const response = await apiClient.post<{ liked: boolean; likeCount: number }>(
    `/comments/${commentId}/likes`,
  )
  return response.data
}

import apiClient from '../lib/apiClient'
import { getToken } from '../lib/secureStore'
import type { ContentResponse, LikeToggleResponse } from '../types/post'
import type { PageResponse } from '../types/page'

export const createPost = async (data: {
  body: string
  tags?: string[]
  groupId?: number | null
}): Promise<ContentResponse> => {
  const response = await apiClient.post<ContentResponse>('/contents', data)
  return response.data
}

export const getGroupPosts = async (
  groupId: number,
  page = 0,
  size = 10,
): Promise<PageResponse<ContentResponse>> => {
  const response = await apiClient.get<PageResponse<ContentResponse>>(
    `/contents/groups/${groupId}`,
    { params: { page, size } },
  )
  return response.data
}

export const uploadContentImage = async (
  contentId: number,
  imageUri: string,
): Promise<void> => {
  const formData = new FormData()
  const filename = imageUri.split('/').pop() ?? 'image.jpg'
  const ext = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase() ?? 'jpeg'
  const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`
  formData.append('file', { uri: imageUri, name: filename, type } as any)
  formData.append('targetId', String(contentId))
  formData.append('targetType', 'CONTENT')

  const token = await getToken()
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''

  const response = await fetch(`${baseUrl}/images`, {
    method: 'POST',
    headers: token ? { Authorization: token } : {},
    // Content-Type 헤더 미설정 — fetch가 FormData 감지 후 multipart/form-data; boundary=... 자동 설정
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error((data as { message?: string }).message ?? `이미지 업로드 실패 (${response.status})`)
  }
}

export const getPosts = async (
  page = 0,
  size = 12,
): Promise<PageResponse<ContentResponse>> => {
  const response = await apiClient.get<PageResponse<ContentResponse>>('/contents', {
    params: { page, size },
  })
  return response.data
}

export const getPost = async (contentId: number): Promise<ContentResponse> => {
  const response = await apiClient.get<ContentResponse>(`/contents/${contentId}`)
  return response.data
}

export const togglePostLike = async (contentId: number): Promise<LikeToggleResponse> => {
  const response = await apiClient.post<LikeToggleResponse>(`/contents/${contentId}/likes`)
  return response.data
}

export const deletePost = async (contentId: number): Promise<void> => {
  await apiClient.delete(`/contents/${contentId}`)
}

export const updatePost = async (
  contentId: number,
  body: string,
  tags?: string[],
): Promise<ContentResponse> => {
  const response = await apiClient.patch<ContentResponse>(`/contents/${contentId}`, { body, tags })
  return response.data
}

export const getUserPosts = async (
  username: string,
  page = 0,
  size = 12,
): Promise<PageResponse<ContentResponse>> => {
  const response = await apiClient.get<PageResponse<ContentResponse>>(
    `/contents/users/${encodeURIComponent(username)}`,
    { params: { page, size } },
  )
  return response.data
}

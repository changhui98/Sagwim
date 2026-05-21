import apiClient from '../lib/apiClient'
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
  const match = /\.(\w+)$/.exec(filename)
  const type = match ? `image/${match[1]}` : 'image/jpeg'
  formData.append('file', { uri: imageUri, name: filename, type } as any)
  formData.append('contentId', String(contentId))
  formData.append('type', 'CONTENT')
  await apiClient.post('/images', formData)
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

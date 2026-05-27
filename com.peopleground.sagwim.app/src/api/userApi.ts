import apiClient from '../lib/apiClient'
import { getToken } from '../lib/secureStore'
import type { UserDetailResponse, UserUpdateRequest } from '../types/user'

export const getMe = async (): Promise<UserDetailResponse> => {
  const response = await apiClient.get<UserDetailResponse>('/users/me')
  return response.data
}

export const updateMyProfile = async (body: UserUpdateRequest): Promise<UserDetailResponse> => {
  const response = await apiClient.patch<UserDetailResponse>('/users/me', body)
  return response.data
}

export const deleteMyAccount = async (reason: string): Promise<void> => {
  await apiClient.delete('/users/me', { data: { reason } })
}

export const uploadUserProfileImage = async (
  imageUri: string,
  userId: string,
): Promise<string> => {
  const filename = imageUri.split('/').pop() ?? 'profile.jpg'
  const ext = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase() ?? 'jpeg'
  const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`

  const formData = new FormData()
  formData.append('file', { uri: imageUri, name: filename, type } as any)
  formData.append('targetType', 'USER')
  formData.append('targetId', userId)

  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''
  const token = await getToken()
  const response = await fetch(`${baseUrl}/images`, {
    method: 'POST',
    headers: token ? { Authorization: token } : {},
    body: formData,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error((data as { message?: string }).message ?? `업로드 실패 (${response.status})`)
  }
  const result = (await response.json()) as { fileUrl: string }
  return result.fileUrl
}

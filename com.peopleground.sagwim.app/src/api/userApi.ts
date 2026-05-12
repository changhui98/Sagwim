import apiClient from '../lib/apiClient'
import type { UserDetailResponse } from '../types/user'

/**
 * 내 프로필 조회.
 * Authorization 헤더는 apiClient 인터셉터가 자동으로 부착합니다.
 */
export const getMe = async (): Promise<UserDetailResponse> => {
  const response = await apiClient.get<UserDetailResponse>('/users/me')
  return response.data
}

import type {
  EmailChangeConfirmRequest,
  EmailChangeRequest,
  PageResponse,
  UserDetailResponse,
  UserResponse,
  UserUpdateRequest,
} from '../types/user'
import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'

export const searchAddress = async (token: string, query: string): Promise<string[]> => {
  const res = await fetch(
    `${API_BASE_URL}/address/search?query=${encodeURIComponent(query)}`,
    { headers: createAuthHeaders(token) },
  )
  if (!res.ok) return []
  const data = (await res.json()) as { suggestions?: string[] }
  return data.suggestions ?? []
}

export const getUsers = (token: string, page = 0, size = 10, keyword = '') => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (keyword.trim()) params.set('keyword', keyword.trim())
  return fetch(`${API_BASE_URL}/users?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<UserResponse>>(response))
}

export const searchUsers = (token: string, keyword: string, page = 0, size = 5) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (keyword.trim()) params.set('keyword', keyword.trim())
  return fetch(`${API_BASE_URL}/users/search?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<UserResponse>>(response))
}

export const getMyProfile = (token: string) => {
  return fetch(`${API_BASE_URL}/users/me`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<UserDetailResponse>(response))
}

export const getUserProfile = (token: string, username: string) => {
  return fetch(`${API_BASE_URL}/users/${encodeURIComponent(username)}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<UserDetailResponse>(response))
}

export const updateMyProfile = (token: string, body: UserUpdateRequest) => {
  return fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
    body: JSON.stringify(body),
  }).then((response) => parseResponse<UserDetailResponse>(response))
}

export const requestEmailChangeVerification = async (
  token: string,
  body: EmailChangeRequest,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/me/email/verify-request`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify(body),
  })
  // 본문은 사용하지 않지만 에러 처리는 parseResponse에 위임한다.
  await parseResponse<{ message: string }>(response)
}

export const confirmEmailChange = async (
  token: string,
  body: EmailChangeConfirmRequest,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/me/email/verify-confirm`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify(body),
  })
  await parseResponse<{ message: string }>(response)
}

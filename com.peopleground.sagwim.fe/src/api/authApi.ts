import type { SignInRequest, SignUpRequest } from '../types/auth'
import { ApiError } from './ApiError'
import { API_BASE_URL } from './config'
import { handleNetworkError, parseResponse } from './apiUtils'

interface SendVerificationRequest {
  email: string
}

interface VerifyEmailRequest {
  email: string
  code: string
}

export const signIn = async (payload: SignInRequest): Promise<string> => {
  let response!: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    handleNetworkError(err)
  }

  // 비-ok 응답이면 parseResponse가 에러 메시지를 파싱해 ApiError를 throw한다.
  if (!response.ok) {
    await parseResponse<never>(response)
  }

  const token = response.headers.get('Authorization') ?? ''
  if (!token) {
    throw new ApiError(response.status, '로그인은 성공했지만 Authorization 토큰이 없습니다.')
  }
  return token
}

export const signUp = async (payload: SignUpRequest) => {
  let response!: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    handleNetworkError(err)
  }

  return parseResponse<unknown>(response)
}

export const sendEmailVerification = async (payload: SendVerificationRequest): Promise<void> => {
  let response!: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/email/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    handleNetworkError(err)
  }

  if (!response.ok) {
    await parseResponse<never>(response)
  }
}

export const verifyEmailCode = async (payload: VerifyEmailRequest): Promise<void> => {
  let response!: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    handleNetworkError(err)
  }

  if (!response.ok) {
    await parseResponse<never>(response)
  }
}

export const checkUsername = async (username: string): Promise<boolean> => {
  let response!: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/check-username?username=${encodeURIComponent(username)}`)
  } catch (err) {
    handleNetworkError(err)
  }

  const data = await parseResponse<{ available: boolean }>(response)
  return data.available
}

export const checkNickname = async (nickname: string): Promise<boolean> => {
  let response!: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`)
  } catch (err) {
    handleNetworkError(err)
  }

  const data = await parseResponse<{ available: boolean }>(response)
  return data.available
}

export const signOut = async (token: string): Promise<void> => {
  if (!token.trim()) return

  const response = await fetch(`${API_BASE_URL}/auth/sign-out`, {
    method: 'POST',
    headers: {
      Authorization: token.trim(),
    },
  })

  // 204 No Content 또는 성공 응답이면 정상.
  // 로그아웃 자체는 서버 오류여도 클라이언트에서 토큰 삭제를 막지 않음.
  if (!response.ok && response.status !== 204) {
    console.warn('[signOut] 서버 로그아웃 실패:', response.status)
  }
}

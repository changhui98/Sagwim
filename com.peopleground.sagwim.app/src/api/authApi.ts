import apiClient from '../lib/apiClient'
import type { SignInRequest, SignUpRequest } from '../types/auth'

/**
 * 로그인 요청.
 * 서버는 토큰을 응답 본문이 아닌 Authorization 헤더로 반환합니다.
 * axios는 응답 헤더 키를 소문자로 정규화하므로 'authorization'으로 접근합니다.
 *
 * @returns Bearer 토큰 문자열 (예: "Bearer eyJ...")
 * @throws 로그인 실패 또는 토큰 누락 시 Error
 */
export const signIn = async (payload: SignInRequest): Promise<string> => {
  const response = await apiClient.post('/auth/sign-in', payload)

  const token: string | undefined = response.headers['authorization']
  if (!token) {
    throw new Error('로그인은 성공했지만 Authorization 토큰이 없습니다.')
  }
  return token
}

/**
 * 회원가입 요청.
 */
export const signUp = async (payload: SignUpRequest): Promise<unknown> => {
  const response = await apiClient.post('/auth/sign-up', payload)
  return response.data
}

/**
 * 로그아웃 요청.
 * 서버 실패 시에도 클라이언트 토큰 삭제를 막지 않으므로 에러를 삼킵니다.
 */
export const signOut = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/sign-out')
  } catch (e) {
    console.warn('[authApi] signOut 서버 요청 실패 (무시):', e)
  }
}

/**
 * 이메일 인증 코드 전송.
 */
export const sendEmailVerification = async (email: string): Promise<void> => {
  await apiClient.post('/auth/email/send-verification', { email })
}

/**
 * 이메일 인증 코드 확인.
 */
export const verifyEmailCode = async (email: string, code: string): Promise<void> => {
  await apiClient.post('/auth/email/verify', { email, code })
}

/**
 * 아이디 중복 확인.
 */
export const checkUsername = async (username: string): Promise<boolean> => {
  const response = await apiClient.get<{ available: boolean }>(
    `/auth/check-username?username=${encodeURIComponent(username)}`,
  )
  return response.data.available
}

/**
 * 닉네임 중복 확인.
 */
export const checkNickname = async (nickname: string): Promise<boolean> => {
  const response = await apiClient.get<{ available: boolean }>(
    `/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`,
  )
  return response.data.available
}

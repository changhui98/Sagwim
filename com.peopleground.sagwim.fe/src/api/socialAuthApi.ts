import type { SocialSignInResponse } from '../types/auth'
import { ApiError } from './ApiError'
import { API_BASE_URL } from './config'

const toErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text()
  if (!text) {
    return `Request failed: ${response.status} ${response.statusText}`
  }
  try {
    const parsed = JSON.parse(text) as { message?: string }
    return parsed.message ?? text
  } catch {
    return text
  }
}

/**
 * 소셜 로그인 (카카오 / 구글)
 * 서버는 Authorization 헤더로 JWT 토큰을 반환하고, 바디에 SocialSignInResponse를 반환한다.
 * 동일 이메일로 가입된 계정이 있으면 409 ApiError를 던진다.
 */
export const socialSignIn = async (
  provider: string,
  code: string,
  redirectUri: string,
): Promise<{ token: string; data: SocialSignInResponse }> => {
  const response = await fetch(`${API_BASE_URL}/auth/social/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, code, redirectUri }),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }

  const token = response.headers.get('Authorization') ?? ''
  if (!token) {
    throw new ApiError(response.status, '소셜 로그인은 성공했지만 Authorization 토큰이 없습니다.')
  }

  const data = (await response.json()) as SocialSignInResponse
  return { token, data }
}

/**
 * 소셜 계정 연동
 * socialSignIn에서 409를 받은 후 사용자 동의 하에 호출한다.
 * 기존 계정에 소셜 provider를 연동하고 JWT를 발급받는다.
 */
export const linkSocialAccount = async (
  provider: string,
  code: string,
  redirectUri: string,
): Promise<{ token: string; data: SocialSignInResponse }> => {
  const response = await fetch(`${API_BASE_URL}/auth/social/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, code, redirectUri }),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }

  const token = response.headers.get('Authorization') ?? ''
  if (!token) {
    throw new ApiError(response.status, '계정 연동은 성공했지만 Authorization 토큰이 없습니다.')
  }

  const data = (await response.json()) as SocialSignInResponse
  return { token, data }
}

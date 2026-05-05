import type { EmailConflictData, SocialSignInResponse } from '../types/auth'
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
 * 동일 이메일로 가입된 계정이 있으면 409 ApiError를 던지되,
 * err.conflictData에 { accessToken, provider }를 포함하여 link 단계에서 재사용할 수 있도록 한다.
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

  if (response.status === 409) {
    const text = await response.text()
    let conflictData: EmailConflictData | undefined
    try {
      const parsed = JSON.parse(text) as Partial<EmailConflictData>
      if (parsed.accessToken && parsed.provider) {
        conflictData = parsed as EmailConflictData
      }
    } catch {
      // JSON 파싱 실패 시 conflictData 없이 throw
    }
    const message = conflictData?.message ?? '동일한 이메일로 가입된 계정이 존재합니다. 계정을 연동해주세요.'
    throw new ApiError(409, message, conflictData)
  }

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
 * code 재사용(invalid_grant) 방지를 위해 code 대신 409 바디의 accessToken을 전달한다.
 */
export const linkSocialAccount = async (
  provider: string,
  accessToken: string,
): Promise<{ token: string; data: SocialSignInResponse }> => {
  const response = await fetch(`${API_BASE_URL}/auth/social/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, accessToken }),
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

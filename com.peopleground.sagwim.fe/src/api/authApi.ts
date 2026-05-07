import type { SignInRequest, SignUpRequest } from '../types/auth'
import { ApiError } from './ApiError'
import { API_BASE_URL } from './config'

/**
 * fetch 호출 자체가 실패한 경우(네트워크 단절, DNS 오류, 서버 프로세스 다운 등)
 * TypeError가 throw되는데, 이를 사용자 친화적인 ApiError로 변환한다.
 */
const wrapNetworkError = (error: unknown): never => {
  if (error instanceof ApiError) throw error
  throw new ApiError(0, '서비스 점검 중입니다. 잠시 후 다시 시도해주세요.')
}

interface SendVerificationRequest {
  email: string
}

interface VerifyEmailRequest {
  email: string
  code: string
}

const toErrorMessage = async (response: Response): Promise<string> => {
  // 5xx 에러 또는 HTML 응답(Cloudflare 프록시 에러 페이지)은 파싱 없이 처리
  if (response.status >= 500) {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      return '서비스 점검 중입니다. 잠시 후 다시 시도해주세요.'
    }
    return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  if (contentType.includes('text/html')) {
    return '서비스 점검 중입니다. 잠시 후 다시 시도해주세요.'
  }

  const text = await response.text()
  if (!text) {
    return `요청을 처리할 수 없습니다. (${response.status})`
  }

  try {
    const parsed = JSON.parse(text) as { message?: string }
    return parsed.message ?? `요청을 처리할 수 없습니다. (${response.status})`
  } catch {
    return `요청을 처리할 수 없습니다. (${response.status})`
  }
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
    wrapNetworkError(err)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
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
    wrapNetworkError(err)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }

  return response.json()
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
    wrapNetworkError(err)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
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
    wrapNetworkError(err)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }
}

export const checkUsername = async (username: string): Promise<boolean> => {
  let response!: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/check-username?username=${encodeURIComponent(username)}`)
  } catch (err) {
    wrapNetworkError(err)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }

  const data = await response.json() as { available: boolean }
  return data.available
}

export const checkNickname = async (nickname: string): Promise<boolean> => {
  let response!: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`)
  } catch (err) {
    wrapNetworkError(err)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }

  const data = await response.json() as { available: boolean }
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

  // 204 No Content 또는 성공 응답이면 정상
  if (!response.ok && response.status !== 204) {
    // 로그아웃 자체는 서버 오류여도 클라이언트에서 토큰 삭제를 막지 않음
    console.warn('[signOut] 서버 로그아웃 실패:', response.status)
  }
}

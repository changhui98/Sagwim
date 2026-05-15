import { ApiError } from './ApiError'

/**
 * 인증이 필요한 API 요청에 공통으로 사용하는 헤더 생성 유틸리티.
 * postApi, userApi, groupApi, imageApi 등에서 중복 정의되던 함수를 단일 모듈로 통합.
 */
export const createAuthHeaders = (token: string): HeadersInit => {
  if (!token.trim()) {
    throw new ApiError(401, '로그인이 필요합니다.')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: token.trim(),
  }
}

/**
 * 5xx 상태 코드에 대한 사용자 친화적 한국어 메시지를 반환한다.
 * - 502/503/504: 서버 점검 또는 일시적 중단 상황을 구분하여 안내
 * - 그 외 5xx: 일반 서버 오류 메시지
 */
const toServerErrorMessage = (status: number): string => {
  if (status === 502 || status === 503 || status === 504) {
    return '서비스 점검 중입니다. 잠시 후 다시 시도해주세요.'
  }
  return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

/**
 * Response의 Content-Type 헤더가 HTML인지 확인한다.
 * Cloudflare 등 프록시 레이어가 반환하는 502/503 HTML 페이지를 감지하기 위해 사용한다.
 */
const isHtmlResponse = (response: Response): boolean => {
  const contentType = response.headers.get('Content-Type') ?? ''
  return contentType.includes('text/html')
}

/**
 * fetch Response를 파싱하고, 오류 시 ApiError를 throw하는 공통 유틸리티.
 *
 * 에러 메시지 처리 전략:
 * - 네트워크 단절(fetch 자체 실패): "서비스 점검 중" 안내
 * - 500 이상 또는 HTML 응답: 사용자 친화적 메시지로 대체 (Cloudflare HTML 노출 방지)
 * - 그 외: 서버 응답 body를 JSON으로 파싱하여 message 필드 추출,
 *          실패 시 일반 fallback 메시지 사용
 */
export const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status >= 500 || isHtmlResponse(response)) {
      throw new ApiError(response.status, toServerErrorMessage(response.status))
    }

    const text = await response.text()
    let message = `요청을 처리할 수 없습니다. (${response.status})`

    if (text) {
      try {
        const parsed = JSON.parse(text) as unknown
        if (
          parsed !== null &&
          typeof parsed === 'object' &&
          'message' in parsed &&
          typeof (parsed as Record<string, unknown>).message === 'string'
        ) {
          message = (parsed as { message: string }).message
        }
      } catch {
        // JSON 파싱 실패 시 fallback 메시지 유지
      }
    }

    throw new ApiError(response.status, message)
  }

  // 204 No Content 또는 빈 body 응답은 JSON 파싱을 시도하지 않는다.
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return undefined as T
  }

  return response.json() as Promise<T>
}

/**
 * fetch 호출 자체가 실패한 경우(네트워크 단절, 서버 프로세스 다운 등)
 * ApiError로 변환하는 래퍼.
 * 사용처: apiUtils 외부에서 fetch를 직접 호출한 후 parseResponse를 쓰지 않는 경우.
 */
export const handleNetworkError = (error: unknown): never => {
  if (error instanceof ApiError) throw error
  throw new ApiError(0, '서비스 점검 중입니다. 잠시 후 다시 시도해주세요.')
}

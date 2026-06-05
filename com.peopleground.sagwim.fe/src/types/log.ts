export interface ErrorLogEntry {
  timestamp: string
  method: string
  path: string
  status: number
  ip: string
  /** 인증 유저면 username, 미인증이면 "anonymous" */
  username: string
  queryParams?: string | null
  requestBody?: string | null
  errorMessage?: string | null
  stacktrace?: string | null
}

export interface RegistrationLogEntry {
  timestamp: string
  username: string
  email: string
  provider: string
}

export interface LogPageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

/** 에러 로그 요약 — 조회 기간 기준 status group별 건수 */
export interface ErrorLogSummary {
  total: number
  count4xx: number
  count5xx: number
}

/** 회원가입 로그 요약 — 조회 기간 기준 provider별 건수 */
export interface RegistrationLogSummary {
  total: number
  /** provider 원본 문자열(대소문자 혼재 가능) → 건수 */
  byProvider: Record<string, number>
}

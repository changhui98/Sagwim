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

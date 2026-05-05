export interface ErrorLogEntry {
  timestamp: string
  method: string
  path: string
  status: number
  ip: string
  userId: string
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

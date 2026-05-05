import type { ErrorLogEntry, LogPageResponse, RegistrationLogEntry } from '../types/log'
import { ApiError } from './ApiError'
import { API_BASE_URL } from './config'

const authHeaders = (token: string): HeadersInit => {
  if (!token.trim()) throw new ApiError(401, '로그인이 필요합니다.')
  return { 'Content-Type': 'application/json', Authorization: token.trim() }
}

const parse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(res.status, text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const getErrorLogs = (
  token: string,
  page = 0,
  size = 50,
): Promise<LogPageResponse<ErrorLogEntry>> =>
  fetch(`${API_BASE_URL}/admin/logs/error?page=${page}&size=${size}`, {
    headers: authHeaders(token),
  }).then((r) => parse(r))

export const getRegistrationLogs = (
  token: string,
  page = 0,
  size = 50,
): Promise<LogPageResponse<RegistrationLogEntry>> =>
  fetch(`${API_BASE_URL}/admin/logs/registration?page=${page}&size=${size}`, {
    headers: authHeaders(token),
  }).then((r) => parse(r))


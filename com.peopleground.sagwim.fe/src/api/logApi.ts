import type { ErrorLogEntry, LogPageResponse, RegistrationLogEntry } from '../types/log'
import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'

export type StatusGroup = 'all' | '4xx' | '5xx'

export interface ErrorLogParams {
  page?: number
  size?: number
  from?: string   // YYYY-MM-DD
  to?: string     // YYYY-MM-DD
  statusGroup?: StatusGroup
}

export const getErrorLogs = (
  token: string,
  page = 0,
  size = 50,
  from?: string,
  to?: string,
  statusGroup: StatusGroup = 'all',
): Promise<LogPageResponse<ErrorLogEntry>> => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    statusGroup,
  })
  if (from) params.set('from', from)
  if (to) params.set('to', to)

  return fetch(`${API_BASE_URL}/admin/logs/error?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((r) => parseResponse<LogPageResponse<ErrorLogEntry>>(r))
}

export const getRegistrationLogs = (
  token: string,
  page = 0,
  size = 50,
  from?: string,
  to?: string,
): Promise<LogPageResponse<RegistrationLogEntry>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  return fetch(`${API_BASE_URL}/admin/logs/registration?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((r) => parseResponse<LogPageResponse<RegistrationLogEntry>>(r))
}

import type { ErrorLogEntry, LogPageResponse, RegistrationLogEntry } from '../types/log'
import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'

export const getErrorLogs = (
  token: string,
  page = 0,
  size = 50,
): Promise<LogPageResponse<ErrorLogEntry>> =>
  fetch(`${API_BASE_URL}/admin/logs/error?page=${page}&size=${size}`, {
    headers: createAuthHeaders(token),
  }).then((r) => parseResponse<LogPageResponse<ErrorLogEntry>>(r))

export const getRegistrationLogs = (
  token: string,
  page = 0,
  size = 50,
): Promise<LogPageResponse<RegistrationLogEntry>> =>
  fetch(`${API_BASE_URL}/admin/logs/registration?page=${page}&size=${size}`, {
    headers: createAuthHeaders(token),
  }).then((r) => parseResponse<LogPageResponse<RegistrationLogEntry>>(r))

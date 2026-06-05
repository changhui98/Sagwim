import type { ChangeUserRoleRequest, PageResponse, UserDetailResponse, UserResponse } from '../types/user'
import type { AdminContentResponse } from '../types/post'
import type { MonthlyStatsResponse } from '../types/adminStats'
import type { AdminImageResponse } from '../types/image'
import type { AdminGroupResponse } from '../types/group'
import type { DeleteLogEntry, DeleteLogSummary } from '../types/deleteLog'
import type { AdminReportEntry } from '../types/report'
import type { AdminInquiryEntry } from '../types/inquiry'
import type { ForbiddenWordResponse } from '../types/moderation'
import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'

export const getAdminUsers = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<UserResponse>> => {
  return fetch(`${API_BASE_URL}/admin/users?page=${page}&size=${size}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<UserResponse>>(response))
}

export const deleteAdminUser = (
  token: string,
  username: string,
  reason: string,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/admin/users/${username}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ reason }),
  }).then((response) => parseResponse<void>(response))
}

export const getAdminUserDetail = (
  token: string,
  username: string,
): Promise<UserDetailResponse> => {
  return fetch(`${API_BASE_URL}/admin/users/${username}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<UserDetailResponse>(response))
}

export const changeUserRole = (
  token: string,
  username: string,
  request: ChangeUserRoleRequest,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/admin/users/${username}/role`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
    body: JSON.stringify(request),
  }).then((response) => parseResponse<void>(response))
}

export const getAdminContents = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<AdminContentResponse>> => {
  return fetch(`${API_BASE_URL}/admin/contents?page=${page}&size=${size}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<AdminContentResponse>>(response))
}

export const deleteAdminContent = (
  token: string,
  contentId: number,
  reason: string,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/admin/contents/${contentId}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ reason }),
  }).then((response) => parseResponse<void>(response))
}

export const restoreAdminContent = (
  token: string,
  contentId: number,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/admin/contents/${contentId}/restore`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<void>(response))
}

export const getAdminContentDetail = (
  token: string,
  contentId: number,
): Promise<AdminContentResponse> => {
  return fetch(`${API_BASE_URL}/admin/contents/${contentId}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<AdminContentResponse>(response))
}

export const getMonthlySignups = (
  token: string,
  months = 12,
): Promise<MonthlyStatsResponse> => {
  return fetch(
    `${API_BASE_URL}/admin/stats/users/monthly-signups?months=${months}`,
    {
      headers: createAuthHeaders(token),
    },
  ).then((response) => parseResponse<MonthlyStatsResponse>(response))
}

export const getMonthlyContentCreations = (
  token: string,
  months = 12,
): Promise<MonthlyStatsResponse> => {
  return fetch(
    `${API_BASE_URL}/admin/stats/contents/monthly-creations?months=${months}`,
    {
      headers: createAuthHeaders(token),
    },
  ).then((response) => parseResponse<MonthlyStatsResponse>(response))
}

export const getMonthlyGroupCreations = (
  token: string,
  months = 12,
): Promise<MonthlyStatsResponse> => {
  return fetch(
    `${API_BASE_URL}/admin/stats/groups/monthly-creations?months=${months}`,
    {
      headers: createAuthHeaders(token),
    },
  ).then((response) => parseResponse<MonthlyStatsResponse>(response))
}

export const getAdminImages = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<AdminImageResponse>> => {
  return fetch(`${API_BASE_URL}/admin/images?page=${page}&size=${size}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<AdminImageResponse>>(response))
}

export const deleteAdminImage = (token: string, imageId: number, reason: string): Promise<void> => {
  return fetch(`${API_BASE_URL}/admin/images/${imageId}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ reason }),
  }).then((response) => parseResponse<void>(response))
}

export const getAdminGroups = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<AdminGroupResponse>> => {
  return fetch(`${API_BASE_URL}/admin/groups?page=${page}&size=${size}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<AdminGroupResponse>>(response))
}

export const approveAdminGroup = (
  token: string,
  groupId: number,
): Promise<AdminGroupResponse> => {
  return fetch(`${API_BASE_URL}/admin/groups/${groupId}/approve`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<AdminGroupResponse>(response))
}

export const rejectAdminGroup = (
  token: string,
  groupId: number,
): Promise<AdminGroupResponse> => {
  return fetch(`${API_BASE_URL}/admin/groups/${groupId}/reject`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<AdminGroupResponse>(response))
}

export const deleteAdminGroup = (token: string, groupId: number, reason: string): Promise<void> => {
  return fetch(`${API_BASE_URL}/admin/groups/${groupId}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ reason }),
  }).then((response) => parseResponse<void>(response))
}

export const getDeleteLogs = (
  token: string,
  page = 0,
  size = 20,
  from?: string,
  to?: string,
): Promise<PageResponse<DeleteLogEntry>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  return fetch(`${API_BASE_URL}/admin/delete-logs?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<DeleteLogEntry>>(response))
}

export const restoreDeleteLog = (
  token: string,
  logId: number,
): Promise<DeleteLogEntry> => {
  return fetch(`${API_BASE_URL}/admin/delete-logs/${logId}/restore`, {
    method: 'POST',
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<DeleteLogEntry>(response))
}

export const getDeleteLogSummary = (
  token: string,
  from?: string,
  to?: string,
): Promise<DeleteLogSummary> => {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  return fetch(`${API_BASE_URL}/admin/delete-logs/summary?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<DeleteLogSummary>(response))
}

export const getAdminReports = (
  token: string,
  page = 0,
  size = 20,
): Promise<PageResponse<AdminReportEntry>> => {
  return fetch(`${API_BASE_URL}/admin/reports?page=${page}&size=${size}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<AdminReportEntry>>(response))
}

export const getAdminInquiries = (
  token: string,
  page = 0,
  size = 20,
): Promise<PageResponse<AdminInquiryEntry>> => {
  return fetch(`${API_BASE_URL}/admin/inquiries?page=${page}&size=${size}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<AdminInquiryEntry>>(response))
}

export const getAdminForbiddenWords = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<ForbiddenWordResponse>> => {
  return fetch(`${API_BASE_URL}/admin/forbidden-words?page=${page}&size=${size}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<ForbiddenWordResponse>>(response))
}

export const createAdminForbiddenWord = (
  token: string,
  word: string,
): Promise<ForbiddenWordResponse> => {
  return fetch(`${API_BASE_URL}/admin/forbidden-words`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ word }),
  }).then((response) => parseResponse<ForbiddenWordResponse>(response))
}

export const updateAdminForbiddenWord = (
  token: string,
  id: number,
  word: string,
): Promise<ForbiddenWordResponse> => {
  return fetch(`${API_BASE_URL}/admin/forbidden-words/${id}`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ word }),
  }).then((response) => parseResponse<ForbiddenWordResponse>(response))
}

export const deleteAdminForbiddenWord = (
  token: string,
  id: number,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/admin/forbidden-words/${id}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<void>(response))
}

export const restoreAdminForbiddenWord = (
  token: string,
  id: number,
): Promise<ForbiddenWordResponse> => {
  return fetch(`${API_BASE_URL}/admin/forbidden-words/${id}/restore`, {
    method: 'POST',
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<ForbiddenWordResponse>(response))
}

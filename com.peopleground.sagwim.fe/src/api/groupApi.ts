import type { PageResponse } from '../types/user'
import type {
  GroupCreateRequest,
  GroupDetailResponse,
  GroupJoinRequestResponse,
  GroupJoinType,
  GroupMemberResponse,
  GroupResponse,
  PlaceSuggestionResponse,
  ScheduleCreateRequest,
  ScheduleResponse,
} from '../types/group'
import type { LikeToggleResponse } from '../types/post'
import { ApiError } from './ApiError'
import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'


export const getGroups = (
  token: string,
  page = 0,
  size = 10,
  keyword?: string,
  category?: string,
): Promise<PageResponse<GroupResponse>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (keyword && keyword.trim()) params.set('keyword', keyword.trim())
  if (category) params.set('category', category)
  return fetch(`${API_BASE_URL}/groups?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PageResponse<GroupResponse>>(res))
}

/**
 * 생성된 지 7일 미만인 신규 모임 목록을 조회합니다.
 * 백엔드에서 기준 날짜 필터링을 처리합니다.
 */
export const getNewGroups = (
  token: string,
  page = 0,
  size = 20,
): Promise<PageResponse<GroupResponse>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return fetch(`${API_BASE_URL}/groups/recent?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PageResponse<GroupResponse>>(res))
}

/**
 * 좋아요 수 내림차순으로 인기 모임 목록을 조회합니다.
 */
export const getPopularGroups = (
  token: string,
  page = 0,
  size = 20,
): Promise<PageResponse<GroupResponse>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return fetch(`${API_BASE_URL}/groups/popular?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PageResponse<GroupResponse>>(res))
}

export const getGroup = (
  token: string,
  groupId: number,
): Promise<GroupDetailResponse> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<GroupDetailResponse>(res))
}

export const createGroup = (
  token: string,
  data: GroupCreateRequest,
): Promise<GroupResponse> => {
  return fetch(`${API_BASE_URL}/groups`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify(data),
  }).then((res) => parseResponse<GroupResponse>(res))
}

export const updateGroup = (
  token: string,
  groupId: number,
  data: Partial<GroupCreateRequest>,
): Promise<GroupResponse> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
    body: JSON.stringify(data),
  }).then((res) => parseResponse<GroupResponse>(res))
}

export const deleteGroup = (token: string, groupId: number): Promise<void> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
  }).then((res) => {
    if (!res.ok) {
      return res.text().then((text) => {
        throw new ApiError(res.status, text || `Request failed: ${res.status}`)
      })
    }
  })
}

export const joinGroup = (token: string, groupId: number, answer?: string): Promise<void> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ answer: answer ?? null }),
  }).then((res) => {
    if (!res.ok) {
      return res.text().then((text) => {
        throw new ApiError(res.status, text || `Request failed: ${res.status}`)
      })
    }
  })
}

export const getGroupJoinQuestions = (
  token: string,
  groupId: number,
): Promise<string[]> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/join-questions`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<string[]>(res))
}

export const updateGroupJoinQuestions = (
  token: string,
  groupId: number,
  questions: string[],
): Promise<void> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/join-questions`, {
    method: 'PUT',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ questions }),
  }).then((res) => {
    if (!res.ok) return res.text().then((t) => { throw new ApiError(res.status, t || `Request failed: ${res.status}`) })
  })
}

export const leaveGroup = (token: string, groupId: number): Promise<void> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/leave`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
  }).then((res) => {
    if (!res.ok) {
      return res.text().then((text) => {
        throw new ApiError(res.status, text || `Request failed: ${res.status}`)
      })
    }
  })
}

export const getGroupMembers = (
  token: string,
  groupId: number,
  page = 0,
  size = 100,
): Promise<PageResponse<GroupMemberResponse>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return fetch(`${API_BASE_URL}/groups/${groupId}/members?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PageResponse<GroupMemberResponse>>(res))
}

export const getMyGroups = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<GroupResponse>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return fetch(`${API_BASE_URL}/groups/me?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PageResponse<GroupResponse>>(res))
}

export const kickGroupMember = (
  token: string,
  groupId: number,
  username: string,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/members/${username}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
  }).then((res) => {
    if (!res.ok) {
      return res.text().then((text) => {
        throw new ApiError(res.status, text || `Request failed: ${res.status}`)
      })
    }
  })
}

export const getGroupSchedules = (
  token: string,
  groupId: number,
  year: number,
  month: number,
): Promise<ScheduleResponse[]> => {
  const params = new URLSearchParams({ year: String(year), month: String(month) })
  return fetch(`${API_BASE_URL}/groups/${groupId}/schedules?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<ScheduleResponse[]>(res))
}

export const createGroupSchedule = (
  token: string,
  groupId: number,
  data: ScheduleCreateRequest,
): Promise<ScheduleResponse> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/schedules`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify(data),
  }).then((res) => parseResponse<ScheduleResponse>(res))
}

export const toggleScheduleAttendance = (
  token: string,
  groupId: number,
  scheduleId: number,
): Promise<{ attending: boolean; attendeeCount: number }> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/schedules/${scheduleId}/attendance`, {
    method: 'POST',
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<{ attending: boolean; attendeeCount: number }>(res))
}


export const searchPlaceSuggestions = (
  token: string,
  query: string,
): Promise<PlaceSuggestionResponse[]> => {
  const params = new URLSearchParams({ query })
  return fetch(`${API_BASE_URL}/places/autocomplete?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PlaceSuggestionResponse[]>(res))
}

export const toggleGroupLike = (token: string, groupId: number): Promise<LikeToggleResponse> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/likes`, {
    method: 'POST',
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<LikeToggleResponse>(res))
}

export const getGroupLikeStatus = (token: string, groupId: number): Promise<{ liked: boolean }> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/likes/me`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<{ liked: boolean }>(res))
}

export interface GroupLikerResponse {
  username: string
  nickname: string
  profileImageUrl: string | null
}

export const getPendingJoinRequests = (
  token: string,
  groupId: number,
): Promise<GroupJoinRequestResponse[]> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/join-requests`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<GroupJoinRequestResponse[]>(res))
}

export const approveJoinRequest = (
  token: string,
  groupId: number,
  requestId: number,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/join-requests/${requestId}/approve`, {
    method: 'POST',
    headers: createAuthHeaders(token),
  }).then((res) => {
    if (!res.ok) return res.text().then((t) => { throw new ApiError(res.status, t || `Request failed: ${res.status}`) })
  })
}

export const rejectJoinRequest = (
  token: string,
  groupId: number,
  requestId: number,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/join-requests/${requestId}/reject`, {
    method: 'POST',
    headers: createAuthHeaders(token),
  }).then((res) => {
    if (!res.ok) return res.text().then((t) => { throw new ApiError(res.status, t || `Request failed: ${res.status}`) })
  })
}

export const updateGroupJoinType = (
  token: string,
  groupId: number,
  group: GroupDetailResponse,
  joinType: GroupJoinType,
): Promise<GroupResponse> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
    body: JSON.stringify({
      name: group.name,
      description: group.description ?? '',
      category: group.category,
      meetingType: group.meetingType,
      region: group.region ?? null,
      maxMemberCount: group.maxMemberCount,
      joinType,
    }),
  }).then((res) => parseResponse<GroupResponse>(res))
}

export const getGroupLikers = (
  token: string,
  groupId: number,
): Promise<GroupLikerResponse[]> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/likes/users`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<GroupLikerResponse[]>(res))
}

export const getMyJoinRequestStatus = (
  token: string,
  groupId: number,
): Promise<{ pending: boolean }> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/join-requests/me`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<{ pending: boolean }>(res))
}

export const cancelMyJoinRequest = (
  token: string,
  groupId: number,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/groups/${groupId}/join-requests/me`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
  }).then((res) => {
    if (!res.ok) return res.text().then((t) => { throw new ApiError(res.status, t || `Request failed: ${res.status}`) })
  })
}

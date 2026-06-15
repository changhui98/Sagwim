import apiClient from '../lib/apiClient'
import { getToken } from '../lib/secureStore'
import type {
  GroupDetailResponse,
  GroupJoinRequestResponse,
  GroupMemberResponse,
  GroupResponse,
  ScheduleCreateRequest,
  ScheduleResponse,
} from '../types/group'
import type { PageResponse } from '../types/page'

/**
 * 생성된 지 7일 미만인 신규 모임 목록 조회.
 * 백엔드에서 기준 날짜 필터링을 처리합니다.
 */
export const getNewGroups = async (
  page = 0,
  size = 20,
): Promise<PageResponse<GroupResponse>> => {
  const response = await apiClient.get<PageResponse<GroupResponse>>('/groups/recent', {
    params: { page, size },
  })
  return response.data
}

/**
 * 좋아요 수 내림차순으로 인기 모임 목록 조회.
 */
export const getPopularGroups = async (
  page = 0,
  size = 20,
): Promise<PageResponse<GroupResponse>> => {
  const response = await apiClient.get<PageResponse<GroupResponse>>('/groups/popular', {
    params: { page, size },
  })
  return response.data
}

/**
 * 사용자 노출 범위 내 모든 모임 목록 조회.
 */
export const getGroups = async (
  page = 0,
  size = 20,
  keyword = '',
): Promise<PageResponse<GroupResponse>> => {
  const params: Record<string, string | number> = { page, size }
  if (keyword.trim()) params.keyword = keyword.trim()
  const response = await apiClient.get<PageResponse<GroupResponse>>('/groups', {
    params,
  })
  return response.data
}

export const getGroup = async (groupId: number): Promise<GroupDetailResponse> => {
  const response = await apiClient.get<GroupDetailResponse>(`/groups/${groupId}`)
  return response.data
}

export const getGroupMembers = async (
  groupId: number,
  page = 0,
  size = 100,
): Promise<PageResponse<GroupMemberResponse>> => {
  const response = await apiClient.get<PageResponse<GroupMemberResponse>>(
    `/groups/${groupId}/members`,
    { params: { page, size } },
  )
  return response.data
}

export const joinGroup = async (groupId: number, answer?: string): Promise<void> => {
  try {
    await apiClient.post(`/groups/${groupId}/join`, { answer: answer ?? null })
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('모임 가입에 실패했습니다.')
  }
}

export const leaveGroup = async (groupId: number): Promise<void> => {
  await apiClient.delete(`/groups/${groupId}/leave`)
}

export const toggleGroupLike = async (
  groupId: number,
): Promise<{ liked: boolean; likeCount: number }> => {
  const response = await apiClient.post<{ liked: boolean; likeCount: number }>(
    `/groups/${groupId}/likes`,
  )
  return response.data
}

export const getGroupLikeStatus = async (groupId: number): Promise<{ liked: boolean }> => {
  const response = await apiClient.get<{ liked: boolean }>(`/groups/${groupId}/likes/me`)
  return response.data
}

export const getMyJoinRequestStatus = async (groupId: number): Promise<{ pending: boolean }> => {
  const response = await apiClient.get<{ pending: boolean }>(
    `/groups/${groupId}/join-requests/me`,
  )
  return response.data
}

export const cancelMyJoinRequest = async (groupId: number): Promise<void> => {
  await apiClient.delete(`/groups/${groupId}/join-requests/me`)
}

export const createGroup = async (data: {
  name: string
  description?: string
  category: string
  meetingType: string
  maxMemberCount: number
  subCategories?: string[]
  joinType?: string
  joinQuestions?: string[]
}): Promise<GroupResponse> => {
  const response = await apiClient.post<GroupResponse>('/groups', data)
  return response.data
}

export const uploadGroupImage = async (groupId: number, imageUri: string): Promise<void> => {
  const formData = new FormData()
  const filename = imageUri.split('/').pop() ?? 'image.jpg'
  const ext = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase() ?? 'jpeg'
  const normalizedExt = ext === 'heic' || ext === 'heif' ? 'jpeg' : ext
  const type = `image/${normalizedExt === 'jpg' ? 'jpeg' : normalizedExt}`
  const safeFilename = filename.includes('.') ? filename : `${filename}.jpg`
  formData.append('file', { uri: imageUri, name: safeFilename, type } as any)

  const token = await getToken()
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''

  const response = await fetch(`${baseUrl}/groups/${groupId}/image`, {
    method: 'PATCH',
    headers: token ? { Authorization: token } : {},
    // Content-Type 헤더 미설정 — fetch가 FormData 감지 후 multipart/form-data; boundary=... 자동 설정
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error((data as { message?: string }).message ?? `그룹 이미지 업로드 실패 (${response.status})`)
  }
}

export const getGroupSchedules = async (
  groupId: number,
  year: number,
  month: number,
): Promise<ScheduleResponse[]> => {
  const response = await apiClient.get<ScheduleResponse[]>(`/groups/${groupId}/schedules`, {
    params: { year, month },
  })
  return response.data
}

export const createGroupSchedule = async (
  groupId: number,
  data: ScheduleCreateRequest,
): Promise<ScheduleResponse> => {
  const response = await apiClient.post<ScheduleResponse>(
    `/groups/${groupId}/schedules`,
    data,
  )
  return response.data
}

export const deleteGroup = async (groupId: number): Promise<void> => {
  await apiClient.delete(`/groups/${groupId}`)
}

export const updateGroup = async (
  groupId: number,
  data: {
    name?: string
    description?: string
    category?: string
    meetingType?: string
    region?: string | null
    maxMemberCount?: number
    joinType?: string
  },
): Promise<void> => {
  await apiClient.patch(`/groups/${groupId}`, data)
}

export const getGroupJoinQuestions = async (groupId: number): Promise<string[]> => {
  const response = await apiClient.get<string[]>(`/groups/${groupId}/join-questions`)
  return response.data
}

export const updateGroupJoinQuestions = async (
  groupId: number,
  questions: string[],
): Promise<void> => {
  await apiClient.put(`/groups/${groupId}/join-questions`, { questions })
}

export const getPendingJoinRequests = async (
  groupId: number,
): Promise<GroupJoinRequestResponse[]> => {
  const response = await apiClient.get<GroupJoinRequestResponse[]>(
    `/groups/${groupId}/join-requests`,
  )
  return response.data
}

export const approveJoinRequest = async (
  groupId: number,
  requestId: number,
): Promise<void> => {
  await apiClient.post(`/groups/${groupId}/join-requests/${requestId}/approve`)
}

export const rejectJoinRequest = async (
  groupId: number,
  requestId: number,
): Promise<void> => {
  await apiClient.post(`/groups/${groupId}/join-requests/${requestId}/reject`)
}

export const toggleScheduleAttendance = async (
  groupId: number,
  scheduleId: number,
): Promise<{ attending: boolean; attendeeCount: number }> => {
  const response = await apiClient.post<{ attending: boolean; attendeeCount: number }>(
    `/groups/${groupId}/schedules/${scheduleId}/attendance`,
  )
  return response.data
}

import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'

export type ReportTargetType = 'POST' | 'COMMENT'

export interface ReportCreateRequest {
  targetType: ReportTargetType
  targetId: number
  reason: string
}

export interface ReportResponse {
  id: number
  targetType: ReportTargetType
  targetId: number
  status: string
  reportedAt: string
}

/**
 * 게시글 또는 댓글을 신고한다.
 * POST /api/v1/reports
 */
export const createReport = (
  token: string,
  req: ReportCreateRequest,
): Promise<ReportResponse> => {
  return fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify(req),
  }).then((response) => parseResponse<ReportResponse>(response))
}

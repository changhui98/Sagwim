import apiClient from '../lib/apiClient'

export type ReportTargetType = 'POST' | 'COMMENT'

export const createReport = async (
  targetType: ReportTargetType,
  targetId: number,
  reason: string,
): Promise<void> => {
  await apiClient.post('/reports', { targetType, targetId, reason })
}

export type ReportTargetType = 'POST' | 'COMMENT' | 'MESSAGE'

export interface AdminReportEntry {
  id: number
  targetType: ReportTargetType
  targetId: number
  targetContent: string
  reporterId: string
  reporterNickname: string
  reason: string
  reportedAt: string
}

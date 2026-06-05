export type DeleteLogTargetType = 'USER' | 'GROUP' | 'POST' | 'IMAGE'

export interface DeleteLogEntry {
  id: number
  deletedBy: string
  targetType: DeleteLogTargetType
  targetId: string
  targetSummary: string
  reason: string | null
  deletedAt: string
  restored: boolean
  restoredAt: string | null
  restoredBy: string | null
}

/** 삭제 로그 요약 — 조회 기간 기준 집계 */
export interface DeleteLogSummary {
  total: number
  /** 대상 유형 → 건수 */
  byTargetType: Record<string, number>
  restored: number
  pending: number
}

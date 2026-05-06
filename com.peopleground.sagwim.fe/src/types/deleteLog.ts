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

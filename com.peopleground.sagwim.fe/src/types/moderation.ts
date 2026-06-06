export type ForbiddenWordStatus = 'ACTIVE' | 'INACTIVE'

export interface ForbiddenWordResponse {
  id: number
  word: string
  createdByNickname: string | null
  createdDate: string
  status: ForbiddenWordStatus
}

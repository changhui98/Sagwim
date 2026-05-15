export interface ForbiddenWordResponse {
  id: number
  word: string
  createdByNickname: string | null
  createdDate: string
  deletedDate: string | null
}

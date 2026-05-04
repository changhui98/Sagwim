export interface CommentResponse {
  id: number
  authorUsername: string | null
  authorNickname: string | null
  body: string
  likeCount: number
  deleted: boolean
  createdAt: string
  updatedAt: string
  replies: CommentResponse[]
}

export interface CommentListResponse {
  comments: CommentResponse[]
  nextCursorId: number | null
  hasNext: boolean
}

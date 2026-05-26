export interface CommentResponse {
  id: number
  authorUsername: string | null
  authorNickname: string | null
  authorProfileImageUrl: string | null
  body: string
  likeCount: number
  likedByMe: boolean
  deleted: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  replies: CommentResponse[]
}

export interface CommentListResponse {
  comments: CommentResponse[]
  nextCursorId: number | null
  hasNext: boolean
}

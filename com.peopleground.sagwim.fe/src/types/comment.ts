export interface CommentResponse {
  id: number
  authorUsername: string | null
  authorNickname: string | null
  authorProfileImageUrl: string | null
  body: string
  likeCount: number
  likedByMe: boolean
  /** 게시글 작성자가 이 댓글에 좋아요를 눌렀는지 여부 (백엔드 미연동 시 undefined) */
  likedByPostAuthor?: boolean
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

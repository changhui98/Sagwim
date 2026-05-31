export interface ContentResponse {
  id: number
  body: string
  createdBy: string
  nickname?: string | null
  createdAt: string
  likeCount?: number
  commentCount?: number
  likedByMe?: boolean
  reportedByMe?: boolean
  tags?: string[]
  imageUrls?: string[]
}

export interface LikeToggleResponse {
  liked: boolean
  likeCount: number
}

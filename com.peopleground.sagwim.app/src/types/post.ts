export interface ContentResponse {
  id: number
  body: string
  createdBy: string
  nickname?: string | null
  createdAt: string
  likeCount?: number
  commentCount?: number
  likedByMe?: boolean
  tags?: string[]
  imageUrls?: string[]
}

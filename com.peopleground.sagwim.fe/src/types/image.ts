export type ImageTargetType = 'USER' | 'CONTENT' | 'GROUP' | 'COMMENT'

export interface AdminImageResponse {
  id: number
  imageCode: string
  originalFilename: string
  fileUrl: string
  targetType: ImageTargetType
  targetId: string
  targetLabel: string
  uploaderUsername: string
  fileSize: number
  contentType: string
  createdDate: string
}

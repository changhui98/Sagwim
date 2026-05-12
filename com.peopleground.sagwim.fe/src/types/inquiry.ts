export type InquirySource = 'WITHDRAWAL' | 'INQUIRY'

export interface AdminInquiryEntry {
  id: number
  source: InquirySource
  content: string
  authorUsername: string | null
  authorNickname: string | null
  createdDate: string
}

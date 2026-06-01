export type MessageType = 'TEXT' | 'SYSTEM'

export interface ChatRoomSummary {
  roomId: number
  partnerUsername: string
  partnerNickname: string
  partnerProfileImageUrl: string | null
  lastMessageContent: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface ChatMessage {
  id: number
  roomId: number
  senderUsername: string
  senderNickname: string
  senderProfileImageUrl: string | null
  content: string
  type: MessageType
  createdDate: string
}

export interface ChatRoom {
  roomId: number
}

export interface SendMessagePayload {
  roomId: number
  content: string
  type?: MessageType
}

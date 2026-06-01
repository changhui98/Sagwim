import apiClient from '../lib/apiClient'
import type { ChatMessage, ChatRoom, ChatRoomSummary } from '../types/chat'
import type { PageResponse } from '../types/page'

/**
 * 상대 유저와의 1:1 채팅방을 생성하거나 기존 방을 반환한다.
 * POST /chat/rooms/direct
 */
export const createDirectRoom = async (targetUserId: string): Promise<ChatRoom> => {
  const response = await apiClient.post<ChatRoom>('/chat/rooms/direct', { targetUserId })
  return response.data
}

/**
 * 내 채팅방 목록을 커서 기반으로 조회한다.
 * GET /chat/rooms?cursor=&size=
 */
export const fetchRooms = async (
  cursor?: number,
  size = 20,
): Promise<PageResponse<ChatRoomSummary>> => {
  const params: Record<string, number> = { size }
  if (cursor !== undefined) params.cursor = cursor
  const response = await apiClient.get<PageResponse<ChatRoomSummary>>('/chat/rooms', { params })
  return response.data
}

/**
 * 특정 방의 메시지를 최신순 커서 기반으로 조회한다.
 * GET /chat/rooms/{roomId}/messages?cursor=&size=
 */
export const fetchMessages = async (
  roomId: number,
  cursor?: number,
  size = 30,
): Promise<PageResponse<ChatMessage>> => {
  const params: Record<string, number> = { size }
  if (cursor !== undefined) params.cursor = cursor
  const response = await apiClient.get<PageResponse<ChatMessage>>(
    `/chat/rooms/${roomId}/messages`,
    { params },
  )
  return response.data
}

/**
 * 특정 방을 lastMessageId 까지 읽음 처리한다.
 * POST /chat/rooms/{roomId}/read
 */
export const markAsRead = async (roomId: number, lastMessageId: number): Promise<void> => {
  await apiClient.post(`/chat/rooms/${roomId}/read`, { lastMessageId })
}

/**
 * 채팅방을 나간다.
 * DELETE /chat/rooms/{roomId}
 */
export const leaveRoom = async (roomId: number): Promise<void> => {
  await apiClient.delete(`/chat/rooms/${roomId}`)
}

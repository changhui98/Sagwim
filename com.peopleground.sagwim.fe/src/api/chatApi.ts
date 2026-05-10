import type { PageResponse } from '../types/user'
import type { ChatMessage, ChatRoom, ChatRoomSummary } from '../types/chat'
import { ApiError } from './ApiError'
import { API_BASE_URL } from './config'
import { createAuthHeaders, parseResponse } from './apiUtils'

export const createDirectRoom = (
  token: string,
  targetUserId: string,
): Promise<ChatRoom> => {
  return fetch(`${API_BASE_URL}/chat/rooms/direct`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ targetUserId }),
  }).then((res) => parseResponse<ChatRoom>(res))
}

export const fetchRooms = (
  token: string,
  cursor?: number,
  size = 20,
): Promise<PageResponse<ChatRoomSummary>> => {
  const params = new URLSearchParams({ size: String(size) })
  if (cursor !== undefined) params.set('cursor', String(cursor))
  return fetch(`${API_BASE_URL}/chat/rooms?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PageResponse<ChatRoomSummary>>(res))
}

export const fetchMessages = (
  token: string,
  roomId: number,
  cursor?: number,
  size = 30,
): Promise<PageResponse<ChatMessage>> => {
  const params = new URLSearchParams({ size: String(size) })
  if (cursor !== undefined) params.set('cursor', String(cursor))
  return fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages?${params.toString()}`, {
    headers: createAuthHeaders(token),
  }).then((res) => parseResponse<PageResponse<ChatMessage>>(res))
}

export const markAsRead = (
  token: string,
  roomId: number,
  lastMessageId: number,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/chat/rooms/${roomId}/read`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ lastMessageId }),
  }).then((res) => {
    if (!res.ok) {
      return res.text().then((text) => {
        throw new ApiError(res.status, text || `Request failed: ${res.status}`)
      })
    }
  })
}

export const leaveRoom = (token: string, roomId: number): Promise<void> => {
  return fetch(`${API_BASE_URL}/chat/rooms/${roomId}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
  }).then((res) => {
    if (!res.ok) {
      return res.text().then((text) => {
        throw new ApiError(res.status, text || `Request failed: ${res.status}`)
      })
    }
  })
}

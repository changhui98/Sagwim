import { useEffect, useRef } from 'react'
import type React from 'react'
import { chatSocket } from '../lib/chatSocket'
import type { ChatMessage, ChatRoomSummary } from '../types/chat'

interface UseChatRoomOptions {
  roomId: number | null
  onMessage: (message: ChatMessage) => void
}

/**
 * 특정 방의 실시간 메시지를 구독한다.
 * 소켓이 아직 연결 중이면 chatSocket 내부 큐에 적재됐다가 onConnect 시점에 자동 처리된다.
 */
export function useChatRoom({ roomId, onMessage }: UseChatRoomOptions) {
  const handlerRef = useRef(onMessage)

  useEffect(() => {
    handlerRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (roomId === null) return
    const handlerId = chatSocket.subscribeRoom(roomId, (msg) => handlerRef.current(msg))
    return () => {
      chatSocket.unsubscribeRoom(roomId, handlerId)
    }
  }, [roomId])
}

interface UseRoomsLiveUpdateOptions {
  rooms: ChatRoomSummary[]
  activeRoomId: number | null
  myUsername: string
  setRooms: React.Dispatch<React.SetStateAction<ChatRoomSummary[]>>
}

/**
 * 채팅방 목록의 마지막 메시지·시간·unread 카운트를 실시간으로 갱신한다.
 * 전역 리스너로 모든 방 메시지를 받고, 각 방의 STOMP 구독을 ensureRoomSubscribed 로 보장한다.
 */
export function useRoomsLiveUpdate({
  rooms,
  activeRoomId,
  myUsername,
  setRooms,
}: UseRoomsLiveUpdateOptions) {
  const activeRoomIdRef = useRef(activeRoomId)
  const myUsernameRef = useRef(myUsername)
  activeRoomIdRef.current = activeRoomId
  myUsernameRef.current = myUsername

  useEffect(() => {
    for (const room of rooms) {
      chatSocket.ensureRoomSubscribed(room.roomId)
    }
  }, [rooms])

  useEffect(() => {
    const unsubscribe = chatSocket.addMessageListener((msg) => {
      const capturedActiveRoomId = activeRoomIdRef.current
      const capturedMyUsername = myUsernameRef.current

      setRooms((prev) => {
        const idx = prev.findIndex((r) => r.roomId === msg.roomId)
        if (idx === -1) return prev

        const isMyMessage = msg.senderUsername === capturedMyUsername
        const isActiveRoom = capturedActiveRoomId === msg.roomId

        const updated: ChatRoomSummary = {
          ...prev[idx],
          lastMessageContent: msg.content,
          lastMessageAt: msg.createdDate,
          unreadCount:
            isMyMessage || isActiveRoom
              ? prev[idx].unreadCount
              : prev[idx].unreadCount + 1,
        }

        const next = prev.filter((r) => r.roomId !== msg.roomId)
        return [updated, ...next]
      })
    })

    return unsubscribe
  }, [setRooms])
}

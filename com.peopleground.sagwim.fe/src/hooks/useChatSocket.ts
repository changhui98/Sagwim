import { useEffect, useRef, useState } from 'react'
import { chatSocket } from '../lib/chatSocket'
import type { ChatMessage, ChatRoomSummary } from '../types/chat'

interface UseChatSocketOptions {
  token: string
  onConnect?: () => void
  onDisconnect?: () => void
}

export function useChatSocket({ token, onConnect, onDisconnect }: UseChatSocketOptions) {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    chatSocket.connect(
      token,
      () => {
        setConnected(true)
        onConnect?.()
      },
      () => {
        setConnected(false)
        onDisconnect?.()
      },
    )

    return () => {
      chatSocket.disconnect()
      setConnected(false)
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  return { connected }
}

interface UseChatRoomOptions {
  roomId: number | null
  onMessage: (message: ChatMessage) => void
}

export function useChatRoom({ roomId, onMessage }: UseChatRoomOptions) {
  const handlerRef = useRef(onMessage)

  useEffect(() => {
    handlerRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    // roomId 가 없거나 유효하지 않은 값(placeholder -1 등)이면 구독하지 않는다.
    if (roomId === null || roomId <= 0) return

    // subscribeRoom은 핸들러 식별자(symbol)를 반환한다.
    // 소켓이 아직 연결 중이면 chatSocket 내부 큐에 적재되었다가
    // onConnect 시점에 자동 처리된다 — setTimeout 지연 불필요.
    const handlerId = chatSocket.subscribeRoom(roomId, (msg) => handlerRef.current(msg))

    return () => {
      chatSocket.unsubscribeRoom(roomId, handlerId)
    }
  }, [roomId])
}

interface UseRoomsLiveUpdateOptions {
  // 구독할 방 목록
  rooms: ChatRoomSummary[]
  // 현재 열려있는 방 id (열린 방은 unreadCount 증가 대상에서 제외)
  activeRoomId: number | null
  // 내 username (내가 보낸 메시지는 unreadCount 증가 대상에서 제외)
  myUsername: string
  // 새 메시지 도착 시 rooms state 업데이트 함수
  setRooms: React.Dispatch<React.SetStateAction<ChatRoomSummary[]>>
}

// MessagesPage에서 채팅방 목록 사이드바의 마지막 메시지 미리보기·시간·unread 카운트를
// 실시간으로 갱신하기 위한 훅.
//
// 설계:
// - chatSocket.addMessageListener를 사용해 모든 채팅 메시지를 단일 전역 리스너로 받는다.
//   per-room handler Map 구조와 분리되어 있어 ChatRoomView와 자료구조를 공유하지 않는다.
// - 각 방의 STOMP 레벨 구독은 ensureRoomSubscribed로 별도 보장한다.
// - 전역 리스너는 마운트 시 1회만 등록하고 언마운트 시 해제한다.
//   리스너 내부에서 사용하는 activeRoomId / myUsername은 ref를 통해 읽어
//   리스너 자체는 재등록되지 않는다.
export function useRoomsLiveUpdate({
  rooms,
  activeRoomId,
  myUsername,
  setRooms,
}: UseRoomsLiveUpdateOptions) {
  // 최신 값을 ref에 보관 — 렌더 본문에서 동기 할당해 즉시 최신값을 유지
  const activeRoomIdRef = useRef(activeRoomId)
  const myUsernameRef = useRef(myUsername)
  activeRoomIdRef.current = activeRoomId
  myUsernameRef.current = myUsername

  // rooms 변경 시 각 방의 STOMP 구독을 보장한다 (구독은 chatSocket 내부에서 idempotent)
  useEffect(() => {
    for (const room of rooms) {
      chatSocket.ensureRoomSubscribed(room.roomId)
    }
  }, [rooms])

  // 전역 메시지 리스너를 마운트 시 1회만 등록.
  // setRooms는 useState dispatch로 안정적이며, ref들도 안정적이다.
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

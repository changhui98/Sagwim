import { useCallback, useEffect, useRef, useState } from 'react'
import { chatSocket } from '../lib/chatSocket'
import type { ChatMessage } from '../types/chat'

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

  const subscribe = useCallback((id: number) => {
    chatSocket.subscribeRoom(id, (msg) => handlerRef.current(msg))
  }, [])

  useEffect(() => {
    if (roomId === null) return

    // 소켓이 아직 연결 중일 수 있으므로 짧게 대기 후 구독
    const timer = setTimeout(() => {
      subscribe(roomId)
    }, 100)

    return () => {
      clearTimeout(timer)
      chatSocket.unsubscribeRoom(roomId)
    }
  }, [roomId, subscribe])
}

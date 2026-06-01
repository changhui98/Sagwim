import { Client } from '@stomp/stompjs'
import type { ChatMessage, SendMessagePayload } from '../types/chat'

type MessageHandler = (message: ChatMessage) => void

/**
 * EXPO_PUBLIC_API_BASE_URL(예: http://192.168.0.10:8080/api/v1) 에서
 * raw WebSocket STOMP 엔드포인트(ws://192.168.0.10:8080/ws-chat-native) 를 도출한다.
 * 웹은 SockJS(/ws-chat) 를 쓰지만, RN 은 SockJS 미지원이라 백엔드의 native 엔드포인트를 사용한다.
 */
function resolveWsUrl(): string {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''
  // /api/v1 (또는 끝의 /api/...) 접미사 제거 → origin 만 남김
  const origin = base.replace(/\/api(\/.*)?$/, '')
  const wsOrigin = origin.replace(/^http/, 'ws')
  return `${wsOrigin}/ws-chat-native`
}

interface PendingSubscription {
  roomId: number
  handler: MessageHandler
  handlerId: symbol
}

interface RoomSubscription {
  unsubscribe: () => void
  handlers: Map<symbol, MessageHandler>
}

class ChatSocketClient {
  private client: Client | null = null
  private subscriptions: Map<number, RoomSubscription> = new Map()
  private pendingSubscriptions: PendingSubscription[] = []
  private globalListeners: Set<MessageHandler> = new Set()

  connect(token: string, onConnect?: () => void, onDisconnect?: () => void): void {
    if (this.client?.connected) return

    this.client = new Client({
      brokerURL: resolveWsUrl(),
      connectHeaders: {
        Authorization: token,
      },
      reconnectDelay: 5000,
      // RN 환경에서는 SockJS 가 아닌 raw WebSocket 을 사용하므로 표준 STOMP 프레임만 처리한다.
      forceBinaryWSFrames: false,
      onConnect: () => {
        const pending = [...this.pendingSubscriptions]
        this.pendingSubscriptions = []
        for (const { roomId, handler, handlerId } of pending) {
          this._subscribeRoomWithId(roomId, handler, handlerId)
        }
        onConnect?.()
      },
      onDisconnect: () => {
        onDisconnect?.()
      },
      onWebSocketClose: () => {
        onDisconnect?.()
      },
      onStompError: (frame) => {
        console.error('STOMP 오류:', frame.headers['message'])
      },
    })

    this.client.activate()
  }

  disconnect(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
    this.subscriptions.clear()
    this.pendingSubscriptions = []
    this.globalListeners.clear()
    void this.client?.deactivate()
    this.client = null
  }

  subscribeRoom(roomId: number, handler: MessageHandler): symbol {
    const handlerId = Symbol(`room-${roomId}`)

    if (!this.client?.connected) {
      this.pendingSubscriptions.push({ roomId, handler, handlerId })
      return handlerId
    }

    this._subscribeRoomWithId(roomId, handler, handlerId)
    return handlerId
  }

  private _subscribeRoomWithId(roomId: number, handler: MessageHandler, handlerId: symbol): void {
    const existing = this.subscriptions.get(roomId)

    if (existing) {
      existing.handlers.set(handlerId, handler)
      return
    }

    const handlers = new Map<symbol, MessageHandler>([[handlerId, handler]])

    const stompSub = this.client!.subscribe(
      `/topic/chat/room/${roomId}`,
      (stompMessage) => {
        try {
          const message = JSON.parse(stompMessage.body) as ChatMessage
          this.subscriptions.get(roomId)?.handlers.forEach((h) => h(message))
          this.globalListeners.forEach((h) => h(message))
        } catch {
          console.error('채팅 메시지 파싱 실패')
        }
      },
    )

    this.subscriptions.set(roomId, { unsubscribe: () => stompSub.unsubscribe(), handlers })
  }

  unsubscribeRoom(roomId: number, handlerId?: symbol): void {
    this.pendingSubscriptions = this.pendingSubscriptions.filter(
      (p) => !(p.roomId === roomId && (handlerId === undefined || p.handlerId === handlerId)),
    )

    const sub = this.subscriptions.get(roomId)
    if (!sub) return

    if (handlerId !== undefined) {
      sub.handlers.delete(handlerId)
      if (sub.handlers.size > 0) return
    }

    sub.unsubscribe()
    this.subscriptions.delete(roomId)
  }

  sendMessage(payload: SendMessagePayload): void {
    if (!this.client?.connected) return
    this.client.publish({
      destination: '/app/chat/message',
      body: JSON.stringify(payload),
    })
  }

  addMessageListener(handler: MessageHandler): () => void {
    this.globalListeners.add(handler)
    return () => {
      this.globalListeners.delete(handler)
    }
  }

  ensureRoomSubscribed(roomId: number): void {
    if (this.subscriptions.has(roomId)) return
    const noop = () => {}
    if (!this.client?.connected) {
      this.pendingSubscriptions.push({ roomId, handler: noop, handlerId: Symbol(`ensure-${roomId}`) })
      return
    }
    this._subscribeRoomWithId(roomId, noop, Symbol(`ensure-${roomId}`))
  }

  get isConnected(): boolean {
    return this.client?.connected ?? false
  }
}

export const chatSocket = new ChatSocketClient()

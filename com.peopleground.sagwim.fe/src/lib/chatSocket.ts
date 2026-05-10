import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { ChatMessage, SendMessagePayload } from '../types/chat'

type MessageHandler = (message: ChatMessage) => void

// 연결 완료 전에 subscribeRoom 이 호출된 경우 큐에 보관했다가
// onConnect 콜백 시점에 일괄 처리한다.
interface PendingSubscription {
  roomId: number
  handler: MessageHandler
  handlerId: symbol
}

interface RoomSubscription {
  // STOMP 레벨 구독 해제 함수
  unsubscribe: () => void
  // 같은 방을 구독하는 핸들러들 (ChatRoomView + MessagesPage 등 복수 허용)
  handlers: Map<symbol, MessageHandler>
}

class ChatSocketClient {
  private client: Client | null = null
  private subscriptions: Map<number, RoomSubscription> = new Map()
  private pendingSubscriptions: PendingSubscription[] = []
  // 모든 채팅 메시지에 대해 호출되는 전역 리스너.
  // per-room handlers Map과 분리되어 있어 ChatRoomView/useRoomsLiveUpdate가
  // 동일 자료구조를 공유하면서 발생할 수 있는 미묘한 버그를 회피한다.
  private globalListeners: Set<MessageHandler> = new Set()

  connect(token: string, onConnect?: () => void, onDisconnect?: () => void): void {
    if (this.client?.connected) return

    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws-chat'),
      connectHeaders: {
        Authorization: token,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        // 연결 완료 후 대기 중이던 구독을 모두 처리한다.
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
    this.client?.deactivate()
    this.client = null
  }

  // 외부 공개 API: 핸들러 식별자(symbol)를 반환한다.
  // 같은 roomId를 여러 곳에서 구독할 수 있으며 각각 독립적으로 해제 가능하다.
  subscribeRoom(roomId: number, handler: MessageHandler): symbol {
    const handlerId = Symbol(`room-${roomId}`)

    if (!this.client?.connected) {
      // 소켓 미연결: 큐에 적재한다.
      this.pendingSubscriptions.push({ roomId, handler, handlerId })
      return handlerId
    }

    this._subscribeRoomWithId(roomId, handler, handlerId)
    return handlerId
  }

  // 내부 구현: STOMP 레벨 구독은 방당 1개만 유지하고 핸들러만 추가한다.
  private _subscribeRoomWithId(roomId: number, handler: MessageHandler, handlerId: symbol): void {
    const existing = this.subscriptions.get(roomId)

    if (existing) {
      // STOMP 구독은 이미 있음 — 핸들러만 추가
      existing.handlers.set(handlerId, handler)
      return
    }

    // 새 STOMP 구독 생성
    const handlers = new Map<symbol, MessageHandler>([[handlerId, handler]])

    const stompSub = this.client!.subscribe(
      `/topic/chat/room/${roomId}`,
      (stompMessage) => {
        try {
          const message = JSON.parse(stompMessage.body) as ChatMessage
          // per-room 핸들러 호출 (ChatRoomView 등)
          this.subscriptions.get(roomId)?.handlers.forEach((h) => h(message))
          // 전역 리스너 호출 (useRoomsLiveUpdate 등)
          this.globalListeners.forEach((h) => h(message))
        } catch {
          console.error('채팅 메시지 파싱 실패')
        }
      },
    )

    this.subscriptions.set(roomId, { unsubscribe: () => stompSub.unsubscribe(), handlers })
  }

  // handlerId 기반 해제: 마지막 핸들러가 제거되면 STOMP 구독도 해제한다.
  unsubscribeRoom(roomId: number, handlerId?: symbol): void {
    // 대기 큐에서 제거한다.
    this.pendingSubscriptions = this.pendingSubscriptions.filter(
      (p) => !(p.roomId === roomId && (handlerId === undefined || p.handlerId === handlerId)),
    )

    const sub = this.subscriptions.get(roomId)
    if (!sub) return

    if (handlerId !== undefined) {
      sub.handlers.delete(handlerId)
      // 남은 핸들러가 있으면 STOMP 구독은 유지
      if (sub.handlers.size > 0) return
    }

    // 핸들러가 모두 제거됐거나 handlerId 없이 호출된 경우 STOMP 구독 해제
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

  // 모든 메시지에 대해 호출되는 전역 리스너 등록.
  // 반환된 함수를 호출하면 리스너가 해제된다.
  // 사이드바 등 여러 방의 메시지를 한곳에서 처리해야 하는 컴포넌트가 사용한다.
  addMessageListener(handler: MessageHandler): () => void {
    this.globalListeners.add(handler)
    return () => {
      this.globalListeners.delete(handler)
    }
  }

  // 외부에서 STOMP 구독만 보장하고 싶을 때 사용 (핸들러 없이).
  // 사이드바가 모든 방의 메시지를 받기 위해 STOMP 레벨 구독을 유지하는 용도.
  ensureRoomSubscribed(roomId: number): void {
    if (this.subscriptions.has(roomId)) return
    if (!this.client?.connected) {
      // 미연결 상태면 noop 핸들러를 큐에 등록 — onConnect 시 STOMP 구독이 생성된다.
      const noop = () => {}
      this.pendingSubscriptions.push({ roomId, handler: noop, handlerId: Symbol(`ensure-${roomId}`) })
      return
    }
    const noop = () => {}
    this._subscribeRoomWithId(roomId, noop, Symbol(`ensure-${roomId}`))
  }

  get isConnected(): boolean {
    return this.client?.connected ?? false
  }
}

export const chatSocket = new ChatSocketClient()

import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { ChatMessage, SendMessagePayload } from '../types/chat'

type MessageHandler = (message: ChatMessage) => void

class ChatSocketClient {
  private client: Client | null = null
  private subscriptions: Map<number, { unsubscribe: () => void }> = new Map()

  connect(token: string, onConnect?: () => void, onDisconnect?: () => void): void {
    if (this.client?.connected) return

    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws-chat'),
      connectHeaders: {
        Authorization: token,
      },
      reconnectDelay: 5000,
      onConnect: () => {
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
    this.client?.deactivate()
    this.client = null
  }

  subscribeRoom(roomId: number, handler: MessageHandler): void {
    if (!this.client?.connected) return
    if (this.subscriptions.has(roomId)) return

    const sub = this.client.subscribe(
      `/topic/chat/room/${roomId}`,
      (stompMessage) => {
        try {
          const message = JSON.parse(stompMessage.body) as ChatMessage
          handler(message)
        } catch {
          console.error('채팅 메시지 파싱 실패')
        }
      },
    )

    this.subscriptions.set(roomId, sub)
  }

  unsubscribeRoom(roomId: number): void {
    const sub = this.subscriptions.get(roomId)
    if (sub) {
      sub.unsubscribe()
      this.subscriptions.delete(roomId)
    }
  }

  sendMessage(payload: SendMessagePayload): void {
    if (!this.client?.connected) return
    this.client.publish({
      destination: '/app/chat/message',
      body: JSON.stringify(payload),
    })
  }

  get isConnected(): boolean {
    return this.client?.connected ?? false
  }
}

export const chatSocket = new ChatSocketClient()

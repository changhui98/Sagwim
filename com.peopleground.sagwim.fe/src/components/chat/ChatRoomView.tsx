import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMessages, markAsRead } from '../../api/chatApi'
import { useAuth } from '../../context/AuthContext'
import { useChatRoom } from '../../hooks/useChatSocket'
import { chatSocket } from '../../lib/chatSocket'
import type { ChatMessage, ChatRoomSummary } from '../../types/chat'
import { getInitials } from '../../utils/stringUtils'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import styles from './ChatRoomView.module.css'

interface Props {
  roomId: number
  roomSummary: ChatRoomSummary | null
  myUsername: string
}

export function ChatRoomView({ roomId, roomSummary, myUsername }: Props) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(
    async (nextCursor?: number) => {
      if (!token) return
      setLoading(true)
      try {
        const res = await fetchMessages(token, roomId, nextCursor)
        setMessages((prev) =>
          nextCursor ? [...prev, ...res.content] : res.content,
        )
        setHasNext(res.hasNext)
        if (res.content.length > 0) {
          setCursor(res.content[res.content.length - 1].id)
        }
      } catch {
        // 에러 무시
      } finally {
        setLoading(false)
      }
    },
    [token, roomId],
  )

  useEffect(() => {
    setMessages([])
    setCursor(undefined)
    setHasNext(false)
    void loadMessages()
  }, [loadMessages])

  // 새 메시지 도착 시 아래로 스크롤
  useEffect(() => {
    if (messages.length > 0 && !cursor) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, cursor])

  // 읽음 처리
  useEffect(() => {
    if (!token || messages.length === 0) return
    const lastId = messages[0].id
    void markAsRead(token, roomId, lastId).catch(() => null)
  }, [token, roomId, messages])

  // 실시간 메시지 수신
  useChatRoom({
    roomId,
    onMessage: (msg) => {
      setMessages((prev) => [msg, ...prev])
    },
  })

  const handleSend = (content: string) => {
    chatSocket.sendMessage({ roomId, content })
  }

  if (!roomSummary) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>대화를 선택하세요.</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/app/messages')}
          aria-label="목록으로 돌아가기"
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className={styles.avatar}>
          {roomSummary.partnerProfileImageUrl ? (
            <img src={roomSummary.partnerProfileImageUrl} alt={roomSummary.partnerNickname} />
          ) : (
            getInitials(roomSummary.partnerNickname)
          )}
        </div>
        <span className={styles.partnerName}>{roomSummary.partnerNickname}</span>
      </div>

      <div className={styles.messageList}>
        <div ref={bottomRef} />
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMyMessage={msg.senderUsername === myUsername}
          />
        ))}
        {hasNext && (
          <div className={styles.loadMore}>
            <button
              className={styles.loadMoreButton}
              onClick={() => void loadMessages(cursor)}
              disabled={loading}
            >
              {loading ? '불러오는 중...' : '이전 메시지 불러오기'}
            </button>
          </div>
        )}
      </div>

      <MessageInput onSend={handleSend} />
    </div>
  )
}

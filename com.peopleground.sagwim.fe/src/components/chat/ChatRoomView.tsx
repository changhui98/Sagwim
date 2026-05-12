import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMessages, markAsRead } from '../../api/chatApi'
import { useAuth } from '../../context/AuthContext'
import { useChatRoom } from '../../hooks/useChatSocket'
import { chatSocket } from '../../lib/chatSocket'
import type { ChatMessage, ChatRoomSummary } from '../../types/chat'
import { getInitials } from '../../utils/stringUtils'
import { HomeButton } from './HomeButton'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import styles from './ChatRoomView.module.css'

// 낙관적 업데이트 메시지의 임시 id 식별자.
// 음수 값을 사용하므로 서버가 발급하는 양수 id와 절대 겹치지 않는다.
let optimisticIdCounter = -1

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

  // 읽음 처리: 낙관적 메시지(음수 id)는 아직 서버에 저장되지 않았으므로 건너뛴다.
  useEffect(() => {
    if (!token || messages.length === 0) return
    const lastId = messages[0].id
    if (lastId <= 0) return
    void markAsRead(token, roomId, lastId).catch(() => null)
  }, [token, roomId, messages])

  // 실시간 메시지 수신: 서버 echo가 도착하면 동일 id의 낙관적 메시지를 교체한다.
  // 낙관적 메시지가 없는 경우(상대방 메시지 등)는 맨 앞에 추가한다.
  useChatRoom({
    roomId,
    onMessage: (msg) => {
      setMessages((prev) => {
        // 이미 서버 id로 존재하는 메시지면 중복 방지
        if (prev.some((m) => m.id === msg.id)) return prev
        // 내가 보낸 메시지 echo가 도착하면 첫 번째 낙관적 메시지(음수 id)를 교체한다.
        const optimisticIdx = prev.findIndex(
          (m) => m.id < 0 && m.senderUsername === msg.senderUsername && m.content === msg.content,
        )
        if (optimisticIdx !== -1) {
          const next = [...prev]
          next[optimisticIdx] = msg
          return next
        }
        return [msg, ...prev]
      })
    },
  })

  const handleSend = (content: string) => {
    // 낙관적 업데이트: 서버 echo를 기다리지 않고 즉시 화면에 표시한다.
    // 임시 id로 음수 값을 사용하므로 서버 id(양수)와 충돌하지 않는다.
    const tempId = optimisticIdCounter--
    const optimistic: ChatMessage = {
      id: tempId,
      roomId,
      senderUsername: myUsername,
      senderNickname: myUsername,
      senderProfileImageUrl: null,
      content,
      type: 'TEXT',
      createdDate: new Date().toISOString(),
    }
    setMessages((prev) => [optimistic, ...prev])
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
        <HomeButton variant="floating" />
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
        <div className={styles.partnerInfo}>
          <div className={styles.avatar}>
            {roomSummary.partnerProfileImageUrl ? (
              <img src={roomSummary.partnerProfileImageUrl} alt={roomSummary.partnerNickname} />
            ) : (
              getInitials(roomSummary.partnerNickname)
            )}
          </div>
          <span className={styles.partnerName}>{roomSummary.partnerNickname}</span>
        </div>
        <HomeButton variant="header" />
      </div>

      <div className={styles.messageList}>
        <div ref={bottomRef} />
        {messages.map((msg, idx) => {
          // messages 배열은 [최신(index 0), ..., 가장 오래된] 역순이고,
          // messageList는 flex-direction: column-reverse 로 렌더링되므로
          // 화면에서 "더 아래에 있는 메시지(더 최신)"는 배열에서 더 작은 인덱스다.
          //
          // 카카오톡 스타일: 같은 발신자·같은 분(시:분)의 연속 그룹에서
          // 화면 기준 가장 아래 메시지(= 그룹 중 배열 인덱스가 가장 낮은 것)에만 시간 표시.
          //
          // 따라서 "이 메시지에 시간을 표시할지"는
          // 바로 앞 인덱스(= 화면상 바로 아래, 더 최신) 메시지와 비교한다:
          //   - 앞 메시지가 없다(현재가 배열 첫 번째 = 화면 최하단) → 표시
          //   - 앞 메시지의 발신자가 다르다 → 표시
          //   - 앞 메시지의 시:분이 다르다 → 표시
          //   - 그 외(같은 발신자·같은 분) → 숨김
          const prev = messages[idx - 1] // 배열 기준 앞 = 화면 기준 아래(더 최신)
          const isSameSenderAndMinute =
            prev !== undefined &&
            prev.senderUsername === msg.senderUsername &&
            new Date(prev.createdDate).getHours() === new Date(msg.createdDate).getHours() &&
            new Date(prev.createdDate).getMinutes() === new Date(msg.createdDate).getMinutes()
          const showTime = !isSameSenderAndMinute

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMyMessage={msg.senderUsername === myUsername}
              showTime={showTime}
            />
          )
        })}
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

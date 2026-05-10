import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChatRoomSummary } from '../../types/chat'
import { getInitials } from '../../utils/stringUtils'
import styles from './ChatSidebar.module.css'

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('ko-KR', { weekday: 'short' })
  }
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

interface Props {
  rooms: ChatRoomSummary[]
  activeRoomId: number | null
}

export function ChatSidebar({ rooms, activeRoomId }: Props) {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  const filtered = keyword.trim()
    ? rooms.filter((r) =>
        r.partnerNickname.toLowerCase().includes(keyword.toLowerCase()),
      )
    : rooms

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>메시지</h2>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="대화 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className={styles.roomList}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span>대화가 없습니다.</span>
          </div>
        ) : (
          filtered.map((room) => (
            <button
              key={room.roomId}
              className={`${styles.roomItem} ${activeRoomId === room.roomId ? styles.active : ''}`}
              onClick={() => navigate(`/app/messages/${room.roomId}`)}
            >
              <div className={styles.avatar}>
                {room.partnerProfileImageUrl ? (
                  <img src={room.partnerProfileImageUrl} alt={room.partnerNickname} />
                ) : (
                  getInitials(room.partnerNickname)
                )}
              </div>
              <div className={styles.roomInfo}>
                <div className={styles.roomTop}>
                  <span className={styles.partnerName}>{room.partnerNickname}</span>
                  <span className={styles.timeStamp}>{formatTime(room.lastMessageAt)}</span>
                </div>
                <div className={styles.lastMessage}>
                  {room.lastMessageContent ?? '대화를 시작해보세요.'}
                </div>
              </div>
              {room.unreadCount > 0 && (
                <span className={styles.unreadBadge}>
                  {room.unreadCount > 99 ? '99+' : room.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </aside>
  )
}

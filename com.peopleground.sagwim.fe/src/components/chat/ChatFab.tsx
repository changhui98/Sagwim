import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchRooms } from '../../api/chatApi'
import { useAuth } from '../../context/AuthContext'
import styles from './ChatFab.module.css'

export function ChatFab() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuth()
  const [unreadTotal, setUnreadTotal] = useState(0)

  const isOnMessagesPage = location.pathname.startsWith('/app/messages')

  useEffect(() => {
    if (isOnMessagesPage || !token) return

    let cancelled = false

    const load = async () => {
      try {
        const res = await fetchRooms(token, undefined, 50)
        if (!cancelled) {
          const total = res.content.reduce((sum, r) => sum + r.unreadCount, 0)
          setUnreadTotal(total)
        }
      } catch {
        // 배지 로딩 실패는 무시
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [token, isOnMessagesPage])

  if (isOnMessagesPage) return null

  return (
    <button
      className={styles.fab}
      onClick={() => navigate('/app/messages')}
      aria-label="메시지 페이지로 이동"
    >
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {unreadTotal > 0 && (
        <span className={styles.badge}>{unreadTotal > 99 ? '99+' : unreadTotal}</span>
      )}
    </button>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchRooms } from '../api/chatApi'
import { MobileHeader } from '../components/MobileHeader'
import { Navbar } from '../components/Navbar'
import { ChatRoomView } from '../components/chat/ChatRoomView'
import { ChatSidebar } from '../components/chat/ChatSidebar'
import { useAuth } from '../context/AuthContext'
import { useChatSocket, useRoomsLiveUpdate } from '../hooks/useChatSocket'
import type { ChatRoomSummary } from '../types/chat'
import styles from './MessagesPage.module.css'

export function MessagesPage() {
  const { roomId: roomIdParam } = useParams<{ roomId?: string }>()
  const { token, meUsername, logout, meRole } = useAuth()
  const navigate = useNavigate()
  const activeRoomId = roomIdParam ? Number(roomIdParam) : null

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const [rooms, setRooms] = useState<ChatRoomSummary[]>([])

  const { connected } = useChatSocket({ token })

  useEffect(() => {
    if (!token) return
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetchRooms(token)
        if (!cancelled) setRooms(res.content)
      } catch {
        // 에러 무시
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  // 채팅방 목록 사이드바 실시간 업데이트:
  // 각 방의 STOMP topic을 구독하여 새 메시지 도착 시 lastMessage·시간·unread 갱신
  useRoomsLiveUpdate({
    rooms,
    activeRoomId,
    myUsername: meUsername ?? '',
    setRooms,
  })

  const activeRoom = activeRoomId
    ? rooms.find((r) => r.roomId === activeRoomId) ?? null
    : null

  const showRoom = activeRoomId !== null
  const layoutClass = showRoom ? styles.showRoom : styles.showList

  return (
    <div className={`${styles.pageWrapper} ${layoutClass}`}>
      <div className={styles.mobileNavOnly}>
        <Navbar role={meRole} onLogout={handleLogout} />
      </div>
      {!showRoom && <MobileHeader onLogout={handleLogout} />}
      <div className={`${styles.chatLayout} ${layoutClass}`}>
        <div className={styles.sidebarWrapper}>
          <ChatSidebar
            rooms={rooms}
            activeRoomId={activeRoomId}
          />
        </div>
        <div className={styles.roomViewWrapper}>
          {activeRoomId !== null ? (
            <ChatRoomView
              key={activeRoomId}
              roomId={activeRoomId}
              roomSummary={activeRoom}
              myUsername={meUsername ?? ''}
            />
          ) : (
            <ChatRoomView
              roomId={-1}
              roomSummary={null}
              myUsername={meUsername ?? ''}
            />
          )}
        </div>
      </div>
      {!connected && rooms.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--clr-warning)', color: '#000', textAlign: 'center', padding: '6px', fontSize: '0.8rem' }}>
          실시간 연결 중...
        </div>
      )}
    </div>
  )
}

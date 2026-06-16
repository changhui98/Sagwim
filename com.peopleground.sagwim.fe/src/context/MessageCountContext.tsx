import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { fetchRooms } from '../api/chatApi'

interface MessageCountContextValue {
  unreadMessageCount: number
  refreshMessageCount: () => Promise<void>
}

const MessageCountContext = createContext<MessageCountContextValue | undefined>(undefined)

/**
 * 메시지 미읽음 카운트를 전역으로 관리한다.
 * 데스크톱 Header와 모바일 Navbar(하단 탭바)가 모두 마운트되므로,
 * 카운트 fetch를 각자 수행하면 중복 호출이 발생한다 — 이 Context에서 단 한 번만 수행한다.
 * 메시지 페이지(/app/messages)에 있을 때는 갱신을 생략한다(목록 화면이 직접 반영).
 */
export function MessageCountProvider({ children }: PropsWithChildren) {
  const { token, isAuthenticated } = useAuth()
  const location = useLocation()
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const isOnMessagesPage = location.pathname.startsWith('/app/messages')

  const refreshMessageCount = useCallback(async () => {
    if (!isAuthenticated || !token) return
    try {
      const res = await fetchRooms(token, undefined, 50)
      const total = res.content.reduce((sum, r) => sum + r.unreadCount, 0)
      setUnreadMessageCount(total)
    } catch {
      // 배지 로딩 실패는 무시 — UX 깜빡임 방지
    }
  }, [isAuthenticated, token])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // 로그아웃 시 배지 초기화 (effect 동기 setState 회피)
      void Promise.resolve().then(() => setUnreadMessageCount(0))
      return
    }
    if (isOnMessagesPage) return
    void refreshMessageCount()
  }, [isAuthenticated, token, isOnMessagesPage, refreshMessageCount])

  const value = useMemo<MessageCountContextValue>(
    () => ({
      unreadMessageCount: isAuthenticated ? unreadMessageCount : 0,
      refreshMessageCount,
    }),
    [isAuthenticated, unreadMessageCount, refreshMessageCount],
  )

  return (
    <MessageCountContext.Provider value={value}>{children}</MessageCountContext.Provider>
  )
}

export function useMessageCount() {
  const context = useContext(MessageCountContext)
  if (!context) {
    throw new Error('useMessageCount must be used within MessageCountProvider')
  }
  return context
}

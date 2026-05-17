import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAuth } from './AuthContext'
import { getUnreadCount, getNotificationStreamUrl } from '../api/notificationApi'

interface NotificationCountContextValue {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
}

const NotificationCountContext = createContext<NotificationCountContextValue | undefined>(
  undefined,
)

/**
 * 알림 미읽음 카운트를 전역으로 관리한다.
 * SSE 연결과 폴백 폴링을 여기서 단 한 번만 수행한다.
 * Navbar / MobileHeader / NotificationsPage 모두 이 Context를 통해 카운트를 읽고 갱신한다.
 */
export function NotificationCountProvider({ children }: PropsWithChildren) {
  const { token, isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !token) return
    try {
      const res = await getUnreadCount(token)
      setUnreadCount(res.count)
    } catch {
      // 네트워크/인증 오류 시 배지를 변경하지 않는다 — UX 깜빡임 방지.
    }
  }, [isAuthenticated, token])

  // SSE 연결 ref — cleanup 시 닫기 위해 ref로 유지
  const esRef = useRef<EventSource | null>(null)
  const fallbackIntervalRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // 로그아웃 시 배지 초기화
      void Promise.resolve().then(() => setUnreadCount(0))
      return
    }

    let visibilityHandler: (() => void) | null = null

    const connect = () => {
      esRef.current?.close()
      const es = new EventSource(getNotificationStreamUrl(token))
      esRef.current = es

      es.addEventListener('unread-count', (e) => {
        try {
          const data = JSON.parse(e.data) as { count: number }
          setUnreadCount(data.count)
        } catch {
          // 파싱 실패 시 무시
        }
      })

      es.onerror = () => {
        es.close()
        esRef.current = null
        if (fallbackIntervalRef.current === undefined) {
          void refreshUnreadCount()
          fallbackIntervalRef.current = window.setInterval(() => {
            void refreshUnreadCount()
          }, 30_000)
        }
      }

      es.onopen = () => {
        if (fallbackIntervalRef.current !== undefined) {
          window.clearInterval(fallbackIntervalRef.current)
          fallbackIntervalRef.current = undefined
        }
      }
    }

    connect()

    visibilityHandler = () => {
      if (
        document.visibilityState === 'visible' &&
        (esRef.current === null || esRef.current.readyState === EventSource.CLOSED)
      ) {
        connect()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)

    return () => {
      esRef.current?.close()
      esRef.current = null
      if (fallbackIntervalRef.current !== undefined) {
        window.clearInterval(fallbackIntervalRef.current)
        fallbackIntervalRef.current = undefined
      }
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler)
      }
    }
  }, [isAuthenticated, token, refreshUnreadCount])

  const value = useMemo<NotificationCountContextValue>(
    () => ({ unreadCount: isAuthenticated ? unreadCount : 0, refreshUnreadCount }),
    [isAuthenticated, unreadCount, refreshUnreadCount],
  )

  return (
    <NotificationCountContext.Provider value={value}>
      {children}
    </NotificationCountContext.Provider>
  )
}

export function useNotificationCount() {
  const context = useContext(NotificationCountContext)
  if (!context) {
    throw new Error('useNotificationCount must be used within NotificationCountProvider')
  }
  return context
}

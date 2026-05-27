import React, {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { getUnreadCount } from '../api/notificationApi'
import { useAuth } from './AuthContext'

interface NotificationCountContextValue {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
}

const NotificationCountContext = createContext<NotificationCountContextValue | undefined>(undefined)

const POLL_INTERVAL_MS = 30_000

export function NotificationCountProvider({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }
    try {
      const res = await getUnreadCount()
      setUnreadCount(res.count)
    } catch {
      // 실패 시 기존 값 유지
    }
  }, [isAuthenticated])

  // 인증 상태 변화 시 카운트 초기화 및 폴링 제어
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // 인증됐으면 즉시 조회 + 30초 폴링 시작
    void refreshUnreadCount()

    intervalRef.current = setInterval(() => {
      void refreshUnreadCount()
    }, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isAuthenticated, refreshUnreadCount])

  // AppState: foreground 전환 시 즉시 갱신
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshUnreadCount()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => {
      subscription.remove()
    }
  }, [refreshUnreadCount])

  const value = useMemo<NotificationCountContextValue>(
    () => ({ unreadCount, refreshUnreadCount }),
    [unreadCount, refreshUnreadCount],
  )

  return (
    <NotificationCountContext.Provider value={value}>
      {children}
    </NotificationCountContext.Provider>
  )
}

export function useNotificationCount(): NotificationCountContextValue {
  const ctx = useContext(NotificationCountContext)
  if (!ctx) throw new Error('useNotificationCount must be used within NotificationCountProvider')
  return ctx
}

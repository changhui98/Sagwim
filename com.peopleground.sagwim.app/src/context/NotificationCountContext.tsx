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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''
const FALLBACK_POLL_MS = 30_000

interface SseHandle {
  abort: () => void
}

/**
 * XHR 스트리밍으로 SSE 연결.
 * React Native는 EventSource를 지원하지 않으므로 XMLHttpRequest onprogress로 구현.
 */
function openSSE(
  token: string,
  onCount: (count: number) => void,
  onClose: () => void,
): SseHandle {
  const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`
  const xhr = new XMLHttpRequest()
  let lastIndex = 0
  let buffer = ''

  xhr.open('GET', url, true)
  xhr.setRequestHeader('Accept', 'text/event-stream')
  xhr.setRequestHeader('Cache-Control', 'no-cache')

  xhr.onprogress = () => {
    buffer += xhr.responseText.slice(lastIndex)
    lastIndex = xhr.responseText.length

    // SSE 이벤트는 빈 줄(\n\n)로 구분
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''

    for (const block of blocks) {
      let eventType = ''
      let data = ''
      for (const line of block.split('\n')) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim()
        else if (line.startsWith('data: ')) data = line.slice(6)
      }
      if (eventType === 'unread-count' && data) {
        try {
          const parsed = JSON.parse(data) as { count: number }
          onCount(parsed.count)
        } catch { /* 파싱 실패 무시 */ }
      }
    }
  }

  xhr.onerror = onClose
  xhr.onload = onClose  // 서버가 스트림을 닫은 경우

  xhr.send()
  return { abort: () => xhr.abort() }
}

export function NotificationCountProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, token } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const sseRef = useRef<SseHandle | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }
    try {
      const res = await getUnreadCount()
      setUnreadCount(res.count)
    } catch { /* 실패 시 기존 값 유지 */ }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0)
      sseRef.current?.abort()
      sseRef.current = null
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }

    // 즉시 1회 조회
    void refreshUnreadCount()

    const startFallbackPoll = () => {
      if (pollRef.current) return
      void refreshUnreadCount()
      pollRef.current = setInterval(() => void refreshUnreadCount(), FALLBACK_POLL_MS)
    }

    const stopFallbackPoll = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }

    // SSE 연결 — 실패/종료 시 폴링으로 전환
    sseRef.current = openSSE(
      token,
      (count) => {
        setUnreadCount(count)
        stopFallbackPoll()  // SSE 수신 중이면 폴링 불필요
      },
      () => {
        sseRef.current = null
        startFallbackPoll()
      },
    )

    return () => {
      sseRef.current?.abort()
      sseRef.current = null
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [isAuthenticated, token, refreshUnreadCount])

  // 앱 포그라운드 복귀 시 즉시 갱신 + SSE 재연결
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active' || !isAuthenticated || !token) return

      void refreshUnreadCount()

      if (!sseRef.current) {
        sseRef.current = openSSE(
          token,
          (count) => {
            setUnreadCount(count)
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
          },
          () => { sseRef.current = null },
        )
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [isAuthenticated, token, refreshUnreadCount])

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

/**
 * 알림 미읽음 카운트 Context
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO: [Push Notifications 전환 시 이 파일 전체를 교체]
 *
 * 현재 방식: SSE (Server-Sent Events) — 앱이 포그라운드 상태일 때만 실시간.
 * 실무 표준: APNs (iOS) / FCM (Android) Push Notifications
 *           → 앱이 꺼져 있어도 알림 수신 가능, 배터리 효율 최적
 *
 * 전환 시 필요한 작업:
 *
 * 1. 패키지 변경
 *    - 제거: react-native-sse
 *    - 추가: expo-notifications
 *      `npx expo install expo-notifications`
 *
 * 2. app.json 변경
 *    plugins 배열에 아래 추가:
 *    [
 *      "expo-notifications",
 *      {
 *        "icon": "./assets/images/notification-icon.png",
 *        "color": "#F08080",
 *        "sounds": []
 *      }
 *    ]
 *
 * 3. 기기 토큰 등록 (앱 시작 시 1회)
 *    const { status } = await Notifications.requestPermissionsAsync()
 *    const token = (await Notifications.getExpoPushTokenAsync()).data
 *    await apiClient.post('/users/me/device-token', { token, platform: 'ios' | 'android' })
 *    // 서버 작업: POST /users/me/device-token 엔드포인트 추가
 *    // 서버 작업: device_tokens 테이블 (user_id, token, platform) 추가
 *
 * 4. 알림 수신 리스너
 *    Notifications.addNotificationReceivedListener(notification => {
 *      // 포그라운드 수신 시 즉시 refreshUnreadCount() 호출
 *    })
 *    Notifications.addNotificationResponseReceivedListener(response => {
 *      // 알림 탭 시 알림 화면으로 이동
 *      router.push('/(app)/notifications')
 *    })
 *
 * 5. 서버 측 Push 발송 추가
 *    알림 생성 시 Expo Push API로 HTTP POST:
 *    POST https://exp.host/--/api/v2/push/send
 *    Body: { to: expoPushToken, title: "...", body: "...", data: { type, targetId } }
 *    (서버가 APNs/FCM 인증서를 직접 관리하지 않아도 됨 — Expo가 대신 처리)
 *
 * 6. 로그아웃 시 기기 토큰 서버에서 삭제
 *    await apiClient.delete('/users/me/device-token', { data: { token } })
 *    // 서버 작업: DELETE /users/me/device-token 엔드포인트 추가
 * ─────────────────────────────────────────────────────────────────────────────
 */

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
import EventSource from 'react-native-sse'
import { getUnreadCount } from '../api/notificationApi'
import { useAuth } from './AuthContext'

interface NotificationCountContextValue {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
}

const NotificationCountContext = createContext<NotificationCountContextValue | undefined>(undefined)

// TODO: [Push 전환 시 삭제] SSE 폴백 폴링 간격 (SSE 연결 실패 시에만 사용)
const FALLBACK_POLL_MS = 30_000

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''

export function NotificationCountProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, token } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  // TODO: [Push 전환 시 삭제] SSE/폴링 ref — Push 전환 후 불필요
  const esRef = useRef<EventSource<'unread-count'> | null>(null)
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

  // TODO: [Push 전환 시 이 useEffect 전체 삭제]
  //       대신: 앱 시작 시 기기 토큰 등록 1회 + Notifications 리스너 등록으로 대체
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0)
      esRef.current?.close()
      esRef.current = null
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }

    void refreshUnreadCount()

    const startFallbackPoll = () => {
      if (pollRef.current) return
      void refreshUnreadCount()
      pollRef.current = setInterval(() => void refreshUnreadCount(), FALLBACK_POLL_MS)
    }

    // TODO: [Push 전환 시 삭제] SSE 연결 — react-native-sse 사용
    //       SSE URL에 token을 쿼리 파라미터로 전달 (EventSource는 커스텀 헤더 불가)
    const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`
    const es = new EventSource<'unread-count'>(url)
    esRef.current = es

    es.addEventListener('unread-count', (e) => {
      if (!e.data) return
      try {
        const parsed = JSON.parse(e.data) as { count: number }
        setUnreadCount(parsed.count)
        // SSE 정상 수신 중이면 폴백 폴링 불필요
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      } catch { /* 파싱 실패 무시 */ }
    })

    es.addEventListener('error', () => {
      es.close()
      esRef.current = null
      // SSE 실패 시 폴링으로 폴백
      startFallbackPoll()
    })

    return () => {
      es.close()
      esRef.current = null
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [isAuthenticated, token, refreshUnreadCount])

  // 포그라운드 복귀 시 즉시 갱신 + SSE 재연결
  // TODO: [Push 전환 시] refreshUnreadCount() 호출은 유지해도 무방 (배지 동기화용)
  //       단, SSE 재연결 블록은 삭제
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active' || !isAuthenticated || !token) return

      void refreshUnreadCount()

      // TODO: [Push 전환 시 삭제] SSE 재연결
      if (!esRef.current && !pollRef.current) {
        const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`
        const es = new EventSource<'unread-count'>(url)
        esRef.current = es

        es.addEventListener('unread-count', (e) => {
          if (!e.data) return
          try {
            const parsed = JSON.parse(e.data) as { count: number }
            setUnreadCount(parsed.count)
          } catch { /* 파싱 실패 무시 */ }
        })

        es.addEventListener('error', () => {
          es.close()
          esRef.current = null
        })
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

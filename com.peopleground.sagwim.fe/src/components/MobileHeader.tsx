import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusSquareIcon, HeartIcon } from './NavIcons'
import { CreateTypeSelectorModal } from './common/CreateTypeSelectorModal'
import { SidePanel, type SidePanelType } from './SidePanel'
import { usePostCreateModal } from '../context/PostCreateModalContext'
import { useAuth } from '../context/AuthContext'
import { getUnreadCount, getNotificationStreamUrl } from '../api/notificationApi'
import styles from './MobileHeader.module.css'

export function MobileHeader() {
  const navigate = useNavigate()
  const { open: openPostCreateModal } = usePostCreateModal()
  const { token, isAuthenticated } = useAuth()
  const [createFlow, setCreateFlow] = useState<'idle' | 'selecting'>('idle')
  const [activePanel, setActivePanel] = useState<SidePanelType | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = useCallback(async () => {
    // 데스크톱에서는 Navbar가 처리하므로 MobileHeader는 조회하지 않음
    if (!window.matchMedia('(max-width: 640px)').matches) return
    if (!isAuthenticated || !token) return
    try {
      const res = await getUnreadCount(token)
      setUnreadCount(res.count)
    } catch {
      // 네트워크/인증 오류 시 배지를 변경하지 않는다 — UX 깜빡임 방지.
    }
  }, [isAuthenticated, token])

  useEffect(() => {
    // 데스크톱에서는 Navbar가 SSE를 담당하므로 MobileHeader는 연결하지 않음
    if (!window.matchMedia('(max-width: 640px)').matches) return
    if (!isAuthenticated || !token) return

    let es: EventSource | null = null
    let fallbackIntervalId: number | undefined
    let visibilityHandler: (() => void) | null = null

    const connect = () => {
      es?.close()
      es = new EventSource(getNotificationStreamUrl(token))

      es.addEventListener('unread-count', (e) => {
        try {
          const data = JSON.parse(e.data) as { count: number }
          setUnreadCount(data.count)
        } catch {
          // 파싱 실패 시 무시
        }
      })

      es.onerror = () => {
        es?.close()
        es = null
        if (fallbackIntervalId === undefined) {
          void refreshUnreadCount()
          fallbackIntervalId = window.setInterval(() => {
            void refreshUnreadCount()
          }, 30_000)
        }
      }

      es.onopen = () => {
        if (fallbackIntervalId !== undefined) {
          window.clearInterval(fallbackIntervalId)
          fallbackIntervalId = undefined
        }
      }
    }

    connect()

    visibilityHandler = () => {
      if (document.visibilityState === 'visible' && (es === null || es.readyState === EventSource.CLOSED)) {
        connect()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)

    return () => {
      es?.close()
      if (fallbackIntervalId !== undefined) window.clearInterval(fallbackIntervalId)
      if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler)
    }
  }, [isAuthenticated, token, refreshUnreadCount])

  const visibleUnreadCount = useMemo(
    () => (isAuthenticated ? unreadCount : 0),
    [isAuthenticated, unreadCount],
  )

  const handleNotificationsClick = useCallback(() => {
    setActivePanel((prev) => (prev === 'notifications' ? null : 'notifications'))
  }, [])

  const closePanel = useCallback(() => {
    setActivePanel(null)
  }, [])

  return (
    <>
      <header className={styles.header}>
        {/* 좌측: + 버튼 */}
        <button
          type="button"
          className={styles.plusButton}
          onClick={() => setCreateFlow('selecting')}
          aria-label="새 모임 만들기"
        >
          <PlusSquareIcon width={22} height={22} />
        </button>

        {/* 가운데: 브랜드 로고 */}
        <div className={styles.brandName}>Sagwim</div>

        {/* 우측: 알림 버튼 */}
        <button
          type="button"
          className={styles.heartButton}
          onClick={handleNotificationsClick}
          aria-label="알림"
        >
          <span className={styles.notifIconWrap}>
            <HeartIcon width={22} height={22} />
            {visibleUnreadCount > 0 && (
              <span
                className={styles.unreadBadge}
                aria-label={`읽지 않은 알림 ${visibleUnreadCount}건`}
              >
                {visibleUnreadCount > 99 ? '99+' : visibleUnreadCount}
              </span>
            )}
          </span>
        </button>
      </header>

      <CreateTypeSelectorModal
        isOpen={createFlow === 'selecting'}
        onClose={() => setCreateFlow('idle')}
        onSelectPost={() => { setCreateFlow('idle'); openPostCreateModal() }}
        onSelectGroup={() => { setCreateFlow('idle'); navigate('/app/groups/new') }}
      />

      <SidePanel
        type={activePanel}
        onClose={closePanel}
        onNotificationsChange={() => { void refreshUnreadCount() }}
      />
    </>
  )
}

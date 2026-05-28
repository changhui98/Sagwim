import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotificationCount } from '../../context/NotificationCountContext'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../api/notificationApi'
import type { NotificationResponse } from '../../types/notification'
import styles from './NotificationsContent.module.css'

/**
 * 알림 메시지 템플릿. 백엔드 NotificationType 별로 분기한다.
 */
function buildNotificationMessage(notification: NotificationResponse): ReactNode {
  const actor = <strong>{notification.actorNickname}</strong>
  switch (notification.type) {
    case 'CONTENT_LIKED':
      return <>{actor}님이 회원님의 게시글을 좋아합니다.</>
    case 'COMMENT_LIKED':
      return <>{actor}님이 회원님의 댓글을 좋아합니다.</>
    case 'COMMENT_ADDED':
      return <>{actor}님이 회원님의 게시글에 댓글을 남겼습니다.</>
    case 'MEETING_MEMBER_JOINED':
      return <>{actor}님이 모임에 가입했습니다.</>
    case 'MEETING_SCHEDULE_ADDED':
      return (
        <>
          <strong>{notification.targetTitle ?? '모임'}</strong> 모임에 새 일정이 등록됐습니다.
        </>
      )
    case 'MEETING_LIKED':
      return <>{actor}님이 <strong>{notification.targetTitle ?? '모임'}</strong>을 좋아합니다.</>
    case 'MEETING_JOIN_REQUESTED':
      return <>{actor}님이 <strong>{notification.targetTitle ?? '모임'}</strong>에 가입을 신청했습니다.</>
    default:
      return null
  }
}

/**
 * 알림 클릭 시 이동 경로. 게시글 상세 / 모임 상세로 분기한다.
 */
function resolveNotificationLink(notification: NotificationResponse): string | null {
  if (notification.targetId == null) return null
  switch (notification.type) {
    case 'CONTENT_LIKED':
    case 'COMMENT_LIKED':
    case 'COMMENT_ADDED':
      return `/app/posts/${notification.targetId}`
    case 'MEETING_MEMBER_JOINED':
    case 'MEETING_SCHEDULE_ADDED':
    case 'MEETING_LIKED':
    case 'MEETING_JOIN_REQUESTED':
      return `/app/groups/${notification.targetId}`
    default:
      return null
  }
}

/**
 * 상대 시간 포맷팅 (분/시간/일). 1주일 이상은 yyyy-MM-dd 로 표기.
 */
function formatRelativeTime(iso: string): string {
  const created = new Date(iso)
  if (Number.isNaN(created.getTime())) return ''
  const diffMs = Date.now() - created.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return '방금'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`
  return created.toLocaleDateString('ko-KR')
}

interface AvatarImageProps {
  src: string
  alt: string
  fallback: string
}

function AvatarImage({ src, alt, fallback }: AvatarImageProps) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [src])

  if (imgError) {
    return <span className={styles.avatarFallback}>{fallback}</span>
  }

  return (
    <img
      src={src}
      alt={alt}
      className={styles.avatarImg}
      onError={() => setImgError(true)}
    />
  )
}

interface NotificationsContentProps {
  /** 알림 항목 클릭 후 호출. SidePanel에서는 패널을 닫고, 페이지에서는 no-op 전달. */
  onClose: () => void
}

export function NotificationsContent({ onClose }: NotificationsContentProps) {
  const { token } = useAuth()
  const { refreshUnreadCount } = useNotificationCount()
  const navigate = useNavigate()
  const [items, setItems] = useState<NotificationResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [markAllPending, setMarkAllPending] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getNotifications(token, 0, 20)
      setItems(res.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알림을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  const hasUnread = items.some((item) => !item.read)

  const handleItemClick = async (notification: NotificationResponse) => {
    if (!notification.read) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      )
      try {
        await markNotificationAsRead(token, notification.id)
      } catch {
        // 서버 동기화 실패는 다음 폴링에서 자연 복구된다.
      } finally {
        void refreshUnreadCount()
      }
    }

    const link = resolveNotificationLink(notification)
    if (link) {
      navigate(link)
    }
    onClose()
  }

  const handleMarkAll = async () => {
    if (markAllPending || !hasUnread) return
    setMarkAllPending(true)
    try {
      await markAllNotificationsAsRead(token)
      setItems((prev) => prev.map((item) => ({ ...item, read: true })))
      void refreshUnreadCount()
    } catch (err) {
      setError(err instanceof Error ? err.message : '모두 읽음 처리에 실패했습니다.')
    } finally {
      setMarkAllPending(false)
    }
  }

  return (
    <div className={styles.body}>
      <div className={styles.notificationToolbar}>
        <button
          type="button"
          className={styles.markAllButton}
          onClick={handleMarkAll}
          disabled={!hasUnread || markAllPending}
        >
          모두 읽음
        </button>
      </div>

      {loading && (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} aria-label="알림 불러오는 중" />
        </div>
      )}

      {!loading && error && <p className={styles.emptyMessage}>{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className={styles.emptyMessage}>새로운 알림이 없습니다.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className={styles.resultList}>
          {items.map((notification) => {
            const itemClassName = `${styles.notificationItem} ${
              notification.read ? '' : styles.notificationItemUnread
            }`.trim()
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  className={itemClassName}
                  onClick={() => void handleItemClick(notification)}
                >
                  <div className={styles.avatar}>
                    {notification.actorProfileImageUrl ? (
                      <AvatarImage
                        src={notification.actorProfileImageUrl}
                        alt={notification.actorNickname}
                        fallback={notification.actorNickname[0]}
                      />
                    ) : (
                      <span className={styles.avatarFallback}>
                        {notification.actorNickname[0]}
                      </span>
                    )}
                  </div>
                  <div className={styles.notificationMeta}>
                    <p className={styles.notificationMessage}>
                      {buildNotificationMessage(notification)}
                    </p>
                    <span className={styles.notificationTime}>
                      {formatRelativeTime(notification.createdDate)}
                    </span>
                  </div>
                  {!notification.read && (
                    <span className={styles.unreadDot} aria-hidden="true" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

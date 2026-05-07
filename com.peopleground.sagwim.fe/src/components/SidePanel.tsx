import { useCallback, useEffect, useRef, useState, type ReactNode, type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { searchUsers } from '../api/userApi'
import { getPosts } from '../api/postApi'
import { getGroups } from '../api/groupApi'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notificationApi'
import type { UserResponse } from '../types/user'
import type { ContentResponse } from '../types/post'
import type { GroupResponse } from '../types/group'
import type { NotificationResponse } from '../types/notification'
import { GROUP_CATEGORY_LABELS } from '../types/group'
import styles from './SidePanel.module.css'

export type SidePanelType = 'search' | 'notifications'

interface SidePanelProps {
  type: SidePanelType | null
  onClose: () => void
  /**
   * 알림 패널 내에서 읽음 처리가 발생했을 때 부모(Navbar)가 미읽음 카운트를 다시 가져오도록 트리거한다.
   * 검색 패널에서는 호출되지 않는다.
   */
  onNotificationsChange?: () => void
}

interface PanelConfig {
  title: string
  renderContent: (onClose: () => void, onNotificationsChange: () => void) => ReactNode
}

interface SearchResults {
  users: UserResponse[]
  posts: ContentResponse[]
  groups: GroupResponse[]
}

interface AvatarImageProps {
  src: string
  alt: string
  fallback: string
}

const AvatarImage: FC<AvatarImageProps> = ({ src, alt, fallback }) => {
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

function SearchContent({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { token } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [usersRes, postsRes, groupsRes] = await Promise.allSettled([
          searchUsers(token, trimmed, 0, 5),
          getPosts(token, 0, 5, trimmed, 'TITLE'),
          getGroups(token, 0, 5, trimmed),
        ])
        setResults({
          users: usersRes.status === 'fulfilled' ? usersRes.value.content : [],
          posts: postsRes.status === 'fulfilled' ? postsRes.value.content : [],
          groups: groupsRes.status === 'fulfilled' ? groupsRes.value.content : [],
        })
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, token])

  const handleUserClick = (username: string) => {
    navigate(`/app/profile/${username}`)
    onClose()
  }

  const handlePostClick = (postId: number) => {
    navigate(`/app/posts/${postId}`)
    onClose()
  }

  const handleGroupClick = (groupId: number) => {
    navigate(`/app/groups/${groupId}`)
    onClose()
  }

  const hasResults =
    results &&
    (results.users.length > 0 || results.posts.length > 0 || results.groups.length > 0)

  return (
    <div className={styles.panelBody}>
      <div className={styles.searchInputWrap}>
        <input
          ref={inputRef}
          type="search"
          className={styles.searchInput}
          placeholder="검색"
          aria-label="검색어 입력"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} aria-label="검색 중" />
        </div>
      )}

      {!loading && !query.trim() && (
        <p className={styles.emptyMessage}>검색어를 입력해주세요.</p>
      )}

      {!loading && query.trim() && results && !hasResults && (
        <p className={styles.emptyMessage}>검색 결과가 없습니다.</p>
      )}

      {!loading && results && results.users.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTitle}>유저</p>
            <button
              type="button"
              className={styles.sectionViewAll}
              onClick={() => { navigate('/app/users'); onClose() }}
            >
              전체 보기
            </button>
          </div>
          <ul className={styles.resultList}>
            {results.users.map((user) => (
              <li key={user.username}>
                <button
                  type="button"
                  className={styles.resultItem}
                  onClick={() => handleUserClick(user.username)}
                >
                  <div className={styles.avatar}>
                    {user.profileImageUrl ? (
                      <AvatarImage
                        src={user.profileImageUrl}
                        alt={user.nickname}
                        fallback={user.nickname[0]}
                      />
                    ) : (
                      <span className={styles.avatarFallback}>{user.nickname[0]}</span>
                    )}
                  </div>
                  <div className={styles.resultMeta}>
                    <span className={styles.resultPrimary}>{user.nickname}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && results && results.posts.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTitle}>게시글</p>
            <button
              type="button"
              className={styles.sectionViewAll}
              onClick={() => { navigate('/app'); onClose() }}
            >
              전체 보기
            </button>
          </div>
          <ul className={styles.resultList}>
            {results.posts.slice(0, 5).map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  className={styles.resultItem}
                  onClick={() => handlePostClick(post.id)}
                >
                  <div className={styles.resultMeta}>
                    <span className={styles.resultPrimary}>
                      {post.body.length > 60 ? post.body.slice(0, 60) + '…' : post.body}
                    </span>
                    <span className={styles.resultSecondary}>
                      {post.nickname ?? post.createdBy}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && results && results.groups.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>모임</p>
          <ul className={styles.resultList}>
            {results.groups.map((group) => (
              <li key={group.id}>
                <button
                  type="button"
                  className={styles.resultItem}
                  onClick={() => handleGroupClick(group.id)}
                >
                  <div className={styles.avatar}>
                    {group.imageUrl ? (
                      <img
                        src={group.imageUrl}
                        alt={group.name}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span className={styles.avatarFallback}>{group.name[0]}</span>
                    )}
                  </div>
                  <div className={styles.resultMeta}>
                    <span className={styles.resultPrimary}>{group.name}</span>
                    <span className={styles.resultSecondary}>
                      {GROUP_CATEGORY_LABELS[group.category]} · {group.currentMemberCount}명
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * 알림 메시지 템플릿. 백엔드 NotificationType 별로 분기한다.
 *
 * 본인이 받은 알림은 모두 본인 컨텍스트이므로 "회원님의" 표현을 일관되게 사용한다.
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

interface NotificationsContentProps {
  onClose: () => void
  onChange: () => void
}

function NotificationsContent({ onClose, onChange }: NotificationsContentProps) {
  const { token } = useAuth()
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
    // 클릭 시 즉시 UI 상으로 읽음 처리하고, 서버 호출은 비동기로 fire-and-forget.
    // 실패해도 사이드 패널 닫고 페이지 이동은 진행한다 — 알림 누락보다 페이지 이동 끊김이 더 큰 UX 손실이다.
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
        onChange()
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
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : '모두 읽음 처리에 실패했습니다.')
    } finally {
      setMarkAllPending(false)
    }
  }

  return (
    <div className={styles.panelBody}>
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


const PANEL_CONFIG: Record<SidePanelType, PanelConfig> = {
  search: {
    title: '검색',
    renderContent: (onClose) => <SearchContent onClose={onClose} />,
  },
  notifications: {
    title: '알림',
    renderContent: (onClose, onChange) => (
      <NotificationsContent onClose={onClose} onChange={onChange} />
    ),
  },
}

export function SidePanel({ type, onClose, onNotificationsChange }: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const isOpen = type !== null

  // 외부 클릭으로 닫기 — 사이드바(aside) 클릭은 제외
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      // 패널 내부 클릭이면 무시
      if (panelRef.current?.contains(target)) return
      // 사이드바(aside) 내부 클릭이면 무시 (버튼 토글은 Navbar에서 처리)
      const sidebar = document.querySelector('aside[aria-label="주 메뉴"]')
      if (sidebar?.contains(target)) return
      onClose()
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    // mousedown으로 등록해야 클릭 이벤트보다 먼저 실행됨
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const config = type ? PANEL_CONFIG[type] : null

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label={config?.title}
      aria-hidden={!isOpen}
    >
      {config && (
        <>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>{config.title}</h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="패널 닫기"
            >
              <CloseIcon />
            </button>
          </div>
          {config.renderContent(onClose, onNotificationsChange ?? (() => {}))}
        </>
      )}
    </div>
  )
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

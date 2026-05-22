import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLikedPosts, getLikedGroups } from '../api/activityApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { extractErrorMessage } from '../utils/errorUtils'
import { GROUP_CATEGORY_LABELS, GROUP_MEETING_TYPE_LABELS } from '../types/group'
import type { ContentResponse } from '../types/post'
import type { GroupResponse } from '../types/group'
import profileStyles from '../components/profile/ProfileEditModal.module.css'
import styles from './MyActivityPage.module.css'
import pageStyles from './SettingsPage.module.css'

const PAGE_SIZE = 10

function formatRelativeTime(dateStr: string): string {
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return '방금'
  if (diffMin < 60) return `${diffMin}분`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간`
  return `${Math.floor(diffHour / 24)}일`
}

export function MyActivityPage() {
  const navigate = useNavigate()
  const { token, meRole } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()
  const handleLogout = useLogout()

  const [likedPosts, setLikedPosts] = useState<ContentResponse[]>([])
  const [likedPostsPage, setLikedPostsPage] = useState(0)
  const [likedPostsHasMore, setLikedPostsHasMore] = useState(false)
  const [likedPostsLoading, setLikedPostsLoading] = useState(false)
  const [likedPostsError, setLikedPostsError] = useState('')

  const [likedGroups, setLikedGroups] = useState<GroupResponse[]>([])
  const [likedGroupsPage, setLikedGroupsPage] = useState(0)
  const [likedGroupsHasMore, setLikedGroupsHasMore] = useState(false)
  const [likedGroupsLoading, setLikedGroupsLoading] = useState(false)
  const [likedGroupsError, setLikedGroupsError] = useState('')

  const loadLikedPosts = useCallback(async (page: number, append: boolean) => {
    setLikedPostsLoading(true)
    setLikedPostsError('')
    try {
      const res = await getLikedPosts(token, page, PAGE_SIZE)
      setLikedPosts((prev) => append ? [...prev, ...res.content] : res.content)
      setLikedPostsHasMore(res.hasNext)
      setLikedPostsPage(page)
    } catch (err) {
      handleUnauthorized(err)
      setLikedPostsError(extractErrorMessage(err, '불러오기에 실패했습니다.'))
    } finally {
      setLikedPostsLoading(false)
    }
  }, [token, handleUnauthorized])

  const loadLikedGroups = useCallback(async (page: number, append: boolean) => {
    setLikedGroupsLoading(true)
    setLikedGroupsError('')
    try {
      const res = await getLikedGroups(token, page, PAGE_SIZE)
      setLikedGroups((prev) => append ? [...prev, ...res.content] : res.content)
      setLikedGroupsHasMore(res.hasNext)
      setLikedGroupsPage(page)
    } catch (err) {
      handleUnauthorized(err)
      setLikedGroupsError(extractErrorMessage(err, '불러오기에 실패했습니다.'))
    } finally {
      setLikedGroupsLoading(false)
    }
  }, [token, handleUnauthorized])

  useEffect(() => {
    loadLikedPosts(0, false)
    loadLikedGroups(0, false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allLoading = likedPostsLoading && likedGroupsLoading
  const hasAnyItem = likedPosts.length > 0 || likedGroups.length > 0

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <main className={pageStyles.main}>
        <div className={pageStyles.container}>
          <header className={profileStyles.header}>
            <button
              type="button"
              className={profileStyles.headerBtn}
              onClick={() => navigate(-1)}
            >
              돌아가기
            </button>
            <h1 className={profileStyles.title}>내 활동</h1>
            <span style={{ minWidth: '4rem' }} />
          </header>

          <div className={styles.panel}>
            {allLoading && !hasAnyItem && (
              <p className={styles.loadingMsg}>불러오는 중...</p>
            )}
            {!allLoading && !hasAnyItem && (
              <p className={styles.emptyMsg}>좋아요한 항목이 없습니다.</p>
            )}

            {likedPosts.map((post) => (
              <div
                key={`lp-${post.id}`}
                role="button"
                tabIndex={0}
                className={styles.item}
                onClick={() => navigate(`/app/posts/${post.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/app/posts/${post.id}`) }}
              >
                <div className={styles.itemContent}>
                  <p className={styles.itemTitle}>{post.body}</p>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemType}>게시글</span>
                    <span>·</span>
                    <span>{post.nickname ?? post.createdBy}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(post.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
            {likedPostsError && likedPosts.length === 0 && (
              <p className={styles.errorMsg}>{likedPostsError}</p>
            )}
            {likedPostsHasMore && (
              <button
                type="button"
                className={styles.loadMoreBtn}
                onClick={() => loadLikedPosts(likedPostsPage + 1, true)}
                disabled={likedPostsLoading}
              >
                {likedPostsLoading ? '불러오는 중...' : '더 보기'}
              </button>
            )}

            {likedGroups.map((group) => (
              <div
                key={`lg-${group.id}`}
                role="button"
                tabIndex={0}
                className={styles.item}
                onClick={() => navigate(`/app/groups/${group.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/app/groups/${group.id}`) }}
              >
                <div className={styles.itemContent}>
                  <p className={styles.itemTitle}>{group.name}</p>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemType}>모임</span>
                    <span>·</span>
                    <span>{GROUP_CATEGORY_LABELS[group.category]}</span>
                    <span>·</span>
                    <span>{GROUP_MEETING_TYPE_LABELS[group.meetingType]}</span>
                    <span>·</span>
                    <span>{group.currentMemberCount}/{group.maxMemberCount}명</span>
                  </div>
                </div>
              </div>
            ))}
            {likedGroupsError && likedGroups.length === 0 && (
              <p className={styles.errorMsg}>{likedGroupsError}</p>
            )}
            {likedGroupsHasMore && (
              <button
                type="button"
                className={styles.loadMoreBtn}
                onClick={() => loadLikedGroups(likedGroupsPage + 1, true)}
                disabled={likedGroupsLoading}
              >
                {likedGroupsLoading ? '불러오는 중...' : '더 보기'}
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

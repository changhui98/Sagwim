import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLikedActivities } from '../api/activityApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { extractErrorMessage } from '../utils/errorUtils'
import type { LikedActivityResponse } from '../types/activity'
import profileStyles from '../components/profile/ProfileEditModal.module.css'
import styles from './MyActivityPage.module.css'

const PAGE_SIZE = 20

export function MyActivityPage() {
  const navigate = useNavigate()
  const { token, meRole } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()
  const handleLogout = useLogout()

  const [likedPosts, setLikedPosts] = useState<LikedActivityResponse[]>([])
  const [likedPostsPage, setLikedPostsPage] = useState(0)
  const [likedPostsHasMore, setLikedPostsHasMore] = useState(false)
  const [likedPostsLoading, setLikedPostsLoading] = useState(false)
  const [likedPostsError, setLikedPostsError] = useState('')

  const panelRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadLikedPosts = useCallback(async (page: number, append: boolean) => {
    setLikedPostsLoading(true)
    setLikedPostsError('')
    try {
      const res = await getLikedActivities(token, page, PAGE_SIZE)
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

  useEffect(() => {
    loadLikedPosts(0, false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sentinel = sentinelRef.current
    const panel = panelRef.current
    if (!sentinel || !panel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && likedPostsHasMore && !likedPostsLoading) {
          loadLikedPosts(likedPostsPage + 1, true)
        }
      },
      { root: panel, rootMargin: '0px 0px 100px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [likedPostsHasMore, likedPostsLoading, likedPostsPage, loadLikedPosts])

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <main className={styles.main}>
        <div className={styles.container}>
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

          <div ref={panelRef} className={styles.panel}>
            {likedPostsLoading && likedPosts.length === 0 && (
              <p className={styles.loadingMsg}>불러오는 중...</p>
            )}
            {!likedPostsLoading && likedPosts.length === 0 && !likedPostsError && (
              <p className={styles.emptyMsg}>좋아요한 활동이 없습니다.</p>
            )}
            {likedPostsError && likedPosts.length === 0 && (
              <p className={styles.errorMsg}>{likedPostsError}</p>
            )}

            {likedPosts.map((activity) => {
              const path = activity.type === 'GROUP'
                ? `/app/groups/${activity.targetId}`
                : `/app/posts/${activity.targetId}`
              const text = activity.type === 'GROUP'
                ? `${activity.label} 모임에 좋아요를 남겼습니다.`
                : `${activity.label}에 좋아요를 남겼습니다.`
              return (
                <div
                  key={`${activity.type}-${activity.targetId}`}
                  role="button"
                  tabIndex={0}
                  className={styles.item}
                  onClick={() => navigate(path)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(path) }}
                >
                  <p className={styles.itemTitle}>{text}</p>
                  <span className={styles.chevron}>›</span>
                </div>
              )
            })}

            {likedPostsLoading && likedPosts.length > 0 && (
              <p className={styles.loadingMore}>불러오는 중...</p>
            )}

            <div ref={sentinelRef} className={styles.sentinel} />
          </div>
        </div>
      </main>
    </>
  )
}

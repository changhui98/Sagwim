import { useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { usePostCreatedSubscription } from '../context/PostCreateModalContext'
import { usePostList } from '../context/PostListContext'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MobileHeader } from '../components/MobileHeader'
import { PostCard } from '../components/post/PostCard'
import { InfiniteScrollLoader } from '../components/post/InfiniteScrollLoader'
import { EndOfList } from '../components/post/EndOfList'
import { Skeleton } from '../components/common/Skeleton'
import { EmptyState } from '../components/common/EmptyState'
import xmarkIcon from '../assets/xmark-svgrepo-com.svg'
import styles from './PostListPage.module.css'

const SKELETON_COUNT = 8

export function PostListPage() {
  const { meRole } = useAuth()
  const handleLogout = useLogout()

  const {
    posts,
    loading,
    isFetchingMore,
    hasMore,
    serviceUnavailable,
    error,
    retry,
    loadMore,
    resetAndRefresh,
    removePost,
  } = usePostList()

  usePostCreatedSubscription(
    useCallback(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      resetAndRefresh()
    }, [resetAndRefresh]),
  )

  // 게시글 상세에서 돌아올 때 이전 스크롤 위치 복원
  useEffect(() => {
    if (loading || posts.length === 0) return
    const saved = sessionStorage.getItem('postList_scrollY')
    if (!saved) return
    const y = Number(saved)
    if (!y) return
    sessionStorage.removeItem('postList_scrollY')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: 'instant' })
      })
    })
  }, [loading, posts])

  const { ref: sentinelRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '0px 0px 200px 0px',
  })

  useEffect(() => {
    if (isIntersecting && hasMore && !isFetchingMore && !loading) {
      loadMore()
    }
  }, [isIntersecting, hasMore, isFetchingMore, loading, loadMore])

  const renderContent = () => {
    if (loading && posts.length === 0) {
      return (
        <div className={styles.feed}>
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <Skeleton width="60px" height="20px" borderRadius="var(--r-full)" />
              <Skeleton height="20px" />
              <Skeleton height="16px" count={3} />
            </div>
          ))}
        </div>
      )
    }

    if (serviceUnavailable) {
      return (
        <div className="card">
          <EmptyState
            title="게시글 서비스를 준비 중입니다."
            description="곧 게시글 기능이 제공될 예정입니다. 잠시만 기다려 주세요."
          />
        </div>
      )
    }

    if (posts.length === 0) {
      return (
        <div className={styles.emptyStateCenter}>
          <EmptyState
            title="아직 작성된 게시글이 없습니다."
            icon={<img src={xmarkIcon} alt="" aria-hidden="true" style={{ width: 68, height: 68 }} />}
          />
        </div>
      )
    }

    return (
      <>
        <div className={styles.feed}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} fullWidth onDeleted={removePost} />
          ))}
        </div>

        {error && (
          <div className={styles.retryBanner}>
            <p className={styles.retryText}>{error}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={retry}>
              다시 시도
            </button>
          </div>
        )}

        {isFetchingMore && <InfiniteScrollLoader />}

        {!hasMore && posts.length > 0 && !error && <EndOfList />}

        <div ref={sentinelRef} className={styles.sentinel} />
      </>
    )
  }

  return (
    <>
      <Navbar role={meRole}
        onLogout={handleLogout} />
      <Header role={meRole}
        onLogout={handleLogout} />
      <MobileHeader onLogout={handleLogout} />

      <main className={styles.main}>
        {renderContent()}
      </main>
      <Footer />
    </>
  )
}

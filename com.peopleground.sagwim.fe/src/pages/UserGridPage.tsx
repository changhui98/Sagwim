import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getMyProfile, getUsers, searchUsers } from '../api/userApi'
import { ApiError } from '../api/ApiError'
import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { Skeleton } from '../components/common/Skeleton'
import { EmptyState } from '../components/common/EmptyState'
import { getInitials, getPastelTone } from '../utils/stringUtils'
import type { UserDetailResponse, UserResponse } from '../types/user'
import styles from './UserGridPage.module.css'

const PAGE_SIZE = 12
const MAX_VISIBLE_PAGES = 5

export function UserGridPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { token, logout } = useAuth()
  const handleLogout = useLogout()

  // 검색 "전체 보기"로 진입한 경우: 해당 검색어의 전체 결과를 보여준다.
  // keyword 없으면 관리자 전용 전체 목록(GET /users) 모드.
  const keyword = searchParams.get('keyword')?.trim() ?? ''

  const [users, setUsers] = useState<UserResponse[]>([])
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')

  // 401(인증 실패)만 로그아웃 대상. 403(권한 부족)은 세션이 유효하므로
  // 로그아웃하면 안 된다 — logout()이 서버 sign-out으로 토큰을 블랙리스트에 올려
  // 다른 탭/기기까지 강제 로그아웃시키기 때문. 403은 에러 안내만 표시한다.
  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )

  const loadUsers = useCallback(
    async (targetPage: number) => {
      try {
        setLoading(true)
        setError('')
        const response = keyword
          ? await searchUsers(token, keyword, targetPage, PAGE_SIZE)
          : await getUsers(token, targetPage, PAGE_SIZE)
        setUsers(response.content)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (err) {
        const message =
          err instanceof ApiError && err.status === 403
            ? '이 페이지에 접근할 권한이 없습니다.'
            : err instanceof Error
              ? err.message
              : '사용자 목록 조회 실패'
        setError(message)
        handleUnauthorized(err)
      } finally {
        setLoading(false)
        setInitialLoad(false)
      }
    },
    [token, keyword, handleUnauthorized],
  )

  const loadProfile = useCallback(async () => {
    try {
      const response = await getMyProfile(token)
      setMyProfile(response)
    } catch (err) {
      handleUnauthorized(err)
    }
  }, [token, handleUnauthorized])

  useEffect(() => {
    loadProfile()
    setPage(0)
    loadUsers(0)
  }, [loadProfile, loadUsers])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadUsers(nextPage)
  }

  const getPageNumbers = (): number[] => {
    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i)
    }
    const half = Math.floor(MAX_VISIBLE_PAGES / 2)
    let start = Math.max(0, page - half)
    const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES)
    if (end - start < MAX_VISIBLE_PAGES) {
      start = Math.max(0, end - MAX_VISIBLE_PAGES)
    }
    return Array.from({ length: end - start }, (_, i) => start + i)
  }

  const renderContent = () => {
    if (initialLoad) {
      return (
        <div className={styles.grid}>
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <Skeleton width="48px" height="48px" borderRadius="var(--r-full)" />
              <Skeleton width="80px" height="18px" />
              <Skeleton width="100px" height="14px" />
              <Skeleton height="1px" />
              <Skeleton width="140px" height="14px" />
              <Skeleton width="50px" height="20px" borderRadius="var(--r-full)" />
            </div>
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="card">
          <EmptyState
            title="사용자 목록을 불러올 수 없습니다."
            description={error}
            action={{ label: '다시 시도', onClick: () => loadUsers(page) }}
          />
        </div>
      )
    }

    if (users.length === 0) {
      return (
        <div className="card">
          <EmptyState
            title={keyword ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
          />
        </div>
      )
    }

    return (
      <>
        <div className={styles.grid} style={{ position: 'relative' }}>
          {loading && <LoadingSpinner overlay />}
          {users.map((user) => (
            <div key={user.id} className={styles.userCard}>
              <span className={`avatar tone-${getPastelTone(user.nickname)} ${styles.userAvatar}`}>
                {getInitials(user.nickname)}
              </span>
              <p className={styles.userNickname}>{user.nickname}</p>
              <p className={styles.userUsername}>@{user.username}</p>
              <div className={styles.userDivider} />
              <span className={styles.userEmail}>{user.userEmail}</span>
              {user.isDeleted ? (
                <span className={`badge ${styles.badgeDeleted}`}>탈퇴</span>
              ) : (
                <span className="badge badge-success">활성</span>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className={styles.paginationBar}>
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => handlePageChange(page - 1)}
              disabled={loading || page === 0}
            >
              이전
            </button>
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={
                  pageNum === page
                    ? styles.pageButtonActive
                    : styles.pageButton
                }
                onClick={() => handlePageChange(pageNum)}
                disabled={loading}
              >
                {pageNum + 1}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => handlePageChange(page + 1)}
              disabled={loading || page >= totalPages - 1}
            >
              다음
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <Navbar role={myProfile?.role ?? null}
        onLogout={handleLogout} />
      <Header role={myProfile?.role ?? null}
        onLogout={handleLogout} />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <h1 className={styles.pageTitle}>
              {keyword ? `'${keyword}' 검색 결과` : '사용자 목록'}
            </h1>
            {totalElements > 0 && (
              <span className={styles.totalChip}>총 {totalElements}명</span>
            )}
          </div>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => loadUsers(page)}
            disabled={loading}
          >
            {loading ? '조회 중...' : '새로고침'}
          </button>
        </div>

        {renderContent()}
      </main>
      <Footer />
    </>
  )
}

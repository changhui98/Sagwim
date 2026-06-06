import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { getMyProfile } from '../../api/userApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { AdminSidebar } from './AdminSidebar'
import { getInitials } from '../../utils/stringUtils'
import type { UserDetailResponse } from '../../types/user'
import styles from './AdminLayout.module.css'

const ALLOWED_ROLES = ['ADMIN', 'MANAGER'] as const
type AllowedRole = (typeof ALLOWED_ROLES)[number]

function isAllowedRole(role: string): role is AllowedRole {
  return (ALLOWED_ROLES as readonly string[]).includes(role)
}

/* 라우트별 페이지 제목 (사이드바 메뉴 라벨과 일치) */
const PAGE_TITLES: Record<string, string> = {
  '/app/admin/charts': '차트',
  '/app/admin/users': '사용자 관리',
  '/app/admin/groups': '모임 관리',
  '/app/admin/posts': '게시글 관리',
  '/app/admin/images': '이미지 관리',
  '/app/admin/reports': '신고 내역',
  // 금지 단어는 페이지가 제목+추가 버튼을 한 줄에 직접 렌더링한다.
  '/app/admin/inquiries': '서비스 관리',
  '/app/admin/logs': '로그',
}

function resolvePageTitle(pathname: string): string {
  if (pathname === '/app/admin') return 'Dashboard'
  const match = Object.entries(PAGE_TITLES).find(([path]) =>
    pathname.startsWith(path),
  )
  return match?.[1] ?? ''
}

interface ProfileBadgeProps {
  profile: UserDetailResponse
}

function ProfileBadge({ profile }: ProfileBadgeProps) {
  const [imgError, setImgError] = useState(false)
  const imageUrl = profile.profileImageUrl?.trim()

  useEffect(() => {
    setImgError(false)
  }, [imageUrl])

  return (
    <div className={styles.userInfo}>
      <span className={`avatar ${styles.navAvatar}`}>
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={`${profile.nickname} 프로필`}
            className={styles.navAvatarImg}
            onError={() => setImgError(true)}
          />
        ) : (
          getInitials(profile.nickname)
        )}
      </span>
      <span className={styles.userName}>{profile.nickname}</span>
    </div>
  )
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, logout } = useAuth()
  const pageTitle = resolvePageTitle(location.pathname)

  const [profile, setProfile] = useState<UserDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const response = await getMyProfile(token)
        if (!isAllowedRole(response.role)) {
          setUnauthorized(true)
          return
        }
        setProfile(response)
      } catch (err) {
        handleUnauthorized(err)
        setUnauthorized(true)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [token, handleUnauthorized])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (unauthorized) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className={styles.wrapper}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <nav className={styles.navbar}>
          <div className={styles.navLeft}>
            <Link to="/app" className={styles.homeButton} aria-label="사이트 홈으로 이동" title="홈으로">
              <svg
                className={styles.iconSvg}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 10.8 12 4l8 6.8"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.5 9.7V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.7"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.5 20v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          <div className={styles.navCenter}>
            <Link to="/app/admin" className={styles.navBrand}>
              Sagwim
            </Link>
          </div>

          <div className={styles.navRight}>
            {profile && <ProfileBadge profile={profile} />}
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </nav>

        <div className={styles.body}>
          <AdminSidebar />
          <main className={styles.content}>
            {pageTitle && <h1 className={styles.pageTitle}>{pageTitle}</h1>}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

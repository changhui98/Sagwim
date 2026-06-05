import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { getMyProfile } from '../../api/userApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { AdminSidebar } from './AdminSidebar'
import type { UserDetailResponse } from '../../types/user'
import styles from './AdminLayout.module.css'

const ALLOWED_ROLES = ['ADMIN', 'MANAGER'] as const
type AllowedRole = (typeof ALLOWED_ROLES)[number]

function isAllowedRole(role: string): role is AllowedRole {
  return (ALLOWED_ROLES as readonly string[]).includes(role)
}

export function AdminLayout() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()

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
                  d="M3 10.5 12 3l9 7.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"
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
            <span className={styles.navBrandSuffix}>Admin</span>
          </div>

          <div className={styles.navRight}>
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
          <AdminSidebar profile={profile} />
          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { SearchIcon, HeartIcon, SettingsIcon, MoonIcon, SunIcon } from './NavIcons'
import { useNotificationCount } from '../context/NotificationCountContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import styles from './MobileHeader.module.css'

export function MobileHeader() {
  const navigate = useNavigate()
  const { unreadCount } = useNotificationCount()
  const { isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleNotificationsClick = () => {
    navigate('/app/notifications')
  }

  return (
    <>
      <header className={styles.header}>
        {/* 좌측: 검색 버튼 — 만들기는 하단 바 가운데 + 버튼으로 이동.
            비로그인도 노출: /app/search가 ProtectedRoute라 탭 시 AuthGate 모달 흐름으로 수렴 */}
        <button
          type="button"
          className={styles.searchButton}
          onClick={() => navigate('/app/search')}
          aria-label="검색"
        >
          <SearchIcon width={22} height={22} />
        </button>

        {/* 가운데: 브랜드 로고 */}
        <div className={styles.brandName}>Sagwim</div>

        {/* 우측: 로그인 시 알림+설정 / 비로그인 시 테마 토글+로그인 */}
        <div className={styles.rightButtons}>
          {isAuthenticated ? (
            <>
              <button
                type="button"
                className={styles.iconButton}
                onClick={handleNotificationsClick}
                aria-label="알림"
              >
                <span className={styles.notifIconWrap}>
                  <HeartIcon width={22} height={22} />
                  {unreadCount > 0 && (
                    <span
                      className={styles.unreadBadge}
                      aria-label={`읽지 않은 알림 ${unreadCount}건`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </button>

              <button
                type="button"
                className={styles.iconButton}
                onClick={() => navigate('/app/settings')}
                aria-label="설정"
              >
                <SettingsIcon width={22} height={22} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.iconButton}
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              >
                {theme === 'dark' ? <SunIcon width={22} height={22} /> : <MoonIcon width={22} height={22} />}
              </button>
              <Link to="/login" className={styles.loginBtn}>
                로그인
              </Link>
            </>
          )}
        </div>
      </header>
    </>
  )
}

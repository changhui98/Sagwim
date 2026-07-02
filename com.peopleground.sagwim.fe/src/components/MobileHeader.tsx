import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusSquareIcon, HeartIcon, GridEvenMoreIcon, MoonIcon, SunIcon } from './NavIcons'
import { MoreMenuPopover } from './MoreMenuPopover'
import { useNotificationCount } from '../context/NotificationCountContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import styles from './MobileHeader.module.css'

interface MobileHeaderProps {
  onLogout: () => void
}

export function MobileHeader({ onLogout }: MobileHeaderProps) {
  const navigate = useNavigate()
  const { unreadCount } = useNotificationCount()
  const { isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreAnchorRef = useRef<HTMLDivElement>(null)

  const handleNotificationsClick = () => {
    navigate('/app/notifications')
  }

  return (
    <>
      <header className={styles.header}>
        {/* 좌측: + 버튼 (비로그인 시 빈 셀 — 로고 중앙 정렬 유지) */}
        {isAuthenticated ? (
          <button
            type="button"
            className={styles.plusButton}
            onClick={() => navigate('/app/create')}
            aria-label="만들기"
          >
            <PlusSquareIcon width={22} height={22} />
          </button>
        ) : (
          <span aria-hidden />
        )}

        {/* 가운데: 브랜드 로고 */}
        <div className={styles.brandName}>Sagwim</div>

        {/* 우측: 로그인 시 알림+더보기 / 비로그인 시 테마 토글+로그인 */}
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

              <div className={styles.moreAnchor} ref={moreAnchorRef}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-label="더 보기"
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                >
                  <GridEvenMoreIcon width={22} height={22} />
                </button>
                <MoreMenuPopover
                  isOpen={moreOpen}
                  onClose={() => setMoreOpen(false)}
                  onLogout={onLogout}
                  anchorRef={moreAnchorRef}
                  placement="header"
                />
              </div>
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

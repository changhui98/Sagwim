import { useCallback, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import styles from './Header.module.css'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotificationCount } from '../context/NotificationCountContext'
import { useMessageCount } from '../context/MessageCountContext'
import { usePostCreateModal } from '../context/PostCreateModalContext'
import { CreateTypeSelectorModal } from './common/CreateTypeSelectorModal'
import { SidePanel, type SidePanelType } from './SidePanel'
import { MoreMenuPopover } from './MoreMenuPopover'
import { MoonIcon, SearchIcon, SunIcon, UserCircleIcon } from './NavIcons'

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGER'])

interface HeaderProps {
  role: string | null
  onLogout: () => void
}

/**
 * 데스크톱(>640px) 전용 상단 가로 헤더.
 * 모바일(≤640px)에서는 CSS로 숨기고 MobileHeader + 하단 탭바(Navbar)가 네비를 담당한다.
 */
export function Header({ role, onLogout }: HeaderProps) {
  const { meRole, meProfileImageUrl } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount } = useNotificationCount()
  const { unreadMessageCount } = useMessageCount()
  const { open: openPostCreateModal } = usePostCreateModal()
  const location = useLocation()
  const navigate = useNavigate()

  const effectiveRole = role ?? meRole ?? null
  const isAdmin = effectiveRole !== null && ADMIN_ROLES.has(effectiveRole)

  const [activePanel, setActivePanel] = useState<SidePanelType | null>(null)
  const [createFlow, setCreateFlow] = useState<'idle' | 'selecting'>('idle')
  const [moreOpen, setMoreOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const togglePanel = useCallback((panel: SidePanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
    setMoreOpen(false)
  }, [])
  const closePanel = useCallback(() => setActivePanel(null), [])

  const path = location.pathname
  const isHome = path === '/app' || path.startsWith('/app/groups')
  const isPosts = path.startsWith('/app/posts')
  const isMessages = path.startsWith('/app/messages')
  const isSettings = path.startsWith('/app/settings')

  return (
    <>
      <header className={styles.header} data-app-header aria-label="주 메뉴">
        <div className={styles.inner}>
          {/* 좌측: 로고 + 공개 네비 */}
          <div className={styles.left}>
            <Link to="/app" className={styles.brand} aria-label="Sagwim 홈">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={styles.brandLogo} aria-hidden focusable={false}>
                <rect x="4" y="4" width="248" height="248" rx="56" fill="none" stroke="#f08080" strokeWidth="4" />
                <g stroke="#f08080" strokeWidth="26" strokeLinecap="round" fill="none">
                  <path d="M128 78 L72 184" />
                  <path d="M128 78 L184 184" />
                </g>
              </svg>
            </Link>
            <nav className={styles.nav}>
              <Link to="/app" className={`${styles.navLink} ${isHome ? styles.navLinkActive : ''}`} aria-current={isHome ? 'page' : undefined}>홈</Link>
              <Link to="/app/posts" className={`${styles.navLink} ${isPosts ? styles.navLinkActive : ''}`} aria-current={isPosts ? 'page' : undefined}>게시글</Link>
            </nav>
          </div>

          {/* 중앙: 전역 검색 트리거 */}
          <button
            type="button"
            className={`${styles.search} ${activePanel === 'search' ? styles.searchActive : ''}`}
            onClick={() => togglePanel('search')}
            aria-label="검색"
          >
            <SearchIcon width={16} height={16} />
            <span className={styles.searchText}>검색</span>
          </button>

          {/* 우측: 텍스트 메뉴 + 아바타 */}
          <div className={styles.right}>
            <button type="button" className={styles.menuLink} onClick={() => setCreateFlow('selecting')}>
              만들기
            </button>

            <Link to="/app/messages" className={`${styles.menuLink} ${isMessages ? styles.menuLinkActive : ''}`}>
              메시지
              {unreadMessageCount > 0 && (
                <span className={styles.badge} aria-label={`읽지 않은 메시지 ${unreadMessageCount}건`}>
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              className={`${styles.menuLink} ${activePanel === 'notifications' ? styles.menuLinkActive : ''}`}
              onClick={() => togglePanel('notifications')}
            >
              알림
              {unreadCount > 0 && (
                <span className={styles.badge} aria-label={`읽지 않은 알림 ${unreadCount}건`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <Link to="/app/settings" className={`${styles.menuLink} ${isSettings ? styles.menuLinkActive : ''}`}>
              설정
            </Link>

            <button
              type="button"
              className={styles.iconBtn}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {theme === 'dark' ? <SunIcon width={20} height={20} /> : <MoonIcon width={20} height={20} />}
            </button>

            <div className={styles.avatarAnchor} ref={avatarRef}>
              <button
                type="button"
                className={`${styles.avatarBtn} ${moreOpen ? styles.avatarBtnOpen : ''}`}
                onClick={() => setMoreOpen((v) => !v)}
                aria-label="내 메뉴"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
              >
                {meProfileImageUrl ? (
                  <img src={meProfileImageUrl} alt="" className={styles.avatarImg} />
                ) : (
                  <UserCircleIcon width={26} height={26} />
                )}
              </button>
              <MoreMenuPopover
                isOpen={moreOpen}
                onClose={() => setMoreOpen(false)}
                onLogout={onLogout}
                anchorRef={avatarRef}
                placement="header"
                compact
                showProfile
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      </header>

      <CreateTypeSelectorModal
        isOpen={createFlow === 'selecting'}
        onClose={() => setCreateFlow('idle')}
        onSelectPost={() => { setCreateFlow('idle'); openPostCreateModal() }}
        onSelectGroup={() => { setCreateFlow('idle'); navigate('/app/groups/new') }}
      />
      <SidePanel type={activePanel} onClose={closePanel} />
    </>
  )
}

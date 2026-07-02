import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'
import { useAuth } from '../context/AuthContext'
import { useNotificationCount } from '../context/NotificationCountContext'
import { useMessageCount } from '../context/MessageCountContext'
import { SidePanel, type SidePanelType } from './SidePanel'
import { MoreMenuPopover } from './MoreMenuPopover'
import {
  ChatIcon,
  GridEvenMoreIcon,
  HeartIcon,
  HomeIcon,
  PlusSquareIcon,
  PostsIcon,
  SearchIcon,
  ShieldIcon,
  UserCircleIcon,
} from './NavIcons'

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGER'])

interface NavbarProps {
  role: string | null
  onLogout: () => void
}

interface NavItem {
  label: string
  icon: ReactNode
  to?: string
  onClick?: () => void
  match?: (pathname: string) => boolean
  adminOnly?: boolean
  authOnly?: boolean
  mobileHidden?: boolean
  desktopHidden?: boolean
}

export function Navbar({ role, onLogout }: NavbarProps) {
  const { meRole, meProfileImageUrl, isAuthenticated } = useAuth()
  const { unreadCount } = useNotificationCount()
  const { unreadMessageCount } = useMessageCount()
  const effectiveRole = role ?? meRole ?? null
  const isAdmin = effectiveRole !== null && ADMIN_ROLES.has(effectiveRole)
  const location = useLocation()
  const navigate = useNavigate()

  const [moreOpen, setMoreOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [activePanel, setActivePanel] = useState<SidePanelType | null>(null)

  const togglePanel = useCallback((panel: SidePanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
    setMoreOpen(false)
  }, [])

  const closePanel = useCallback(() => {
    setActivePanel(null)
  }, [])

  const navItems: NavItem[] = [
    {
      to: '/app',
      label: '홈',
      icon: <HomeIcon />,
      match: (p) => p === '/app' || p.startsWith('/app/groups'),
    },
    {
      label: '검색',
      icon: <SearchIcon />,
      onClick: () => {
        if (window.innerWidth > 640) {
          togglePanel('search')
        } else {
          navigate('/app/search')
        }
      },
      match: (p) => activePanel === 'search' || p.startsWith('/app/search'),
    },
    {
      to: '/app/posts',
      label: '게시글',
      icon: <PostsIcon />,
      match: (p) => p.startsWith('/app/posts'),
    },
    {
      to: '/app/create',
      label: '만들기',
      icon: <PlusSquareIcon />,
      match: (p) => p.startsWith('/app/create'),
      mobileHidden: true,
      authOnly: true,
    },
    {
      to: '/app/messages',
      label: '메시지',
      icon: (
        <span className={styles.navIconWrap}>
          <ChatIcon />
          {unreadMessageCount > 0 && (
            <span
              className={styles.unreadBadge}
              aria-label={`읽지 않은 메시지 ${unreadMessageCount}건`}
            >
              {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
            </span>
          )}
        </span>
      ),
      match: (p) => p.startsWith('/app/messages'),
      authOnly: true,
    },
    {
      to: '/app/profile',
      label: '프로필',
      icon: meProfileImageUrl ? (
        <span className={styles.navAvatar} aria-hidden="true">
          <img src={meProfileImageUrl} alt="" className={styles.navAvatarImg} />
        </span>
      ) : (
        <UserCircleIcon />
      ),
      match: (p) => p.startsWith('/app/profile'),
      authOnly: true,
    },
    {
      label: '알림',
      icon: (
        <span className={styles.navIconWrap}>
          <HeartIcon />
          {unreadCount > 0 && (
            <span
              className={styles.unreadBadge}
              aria-label={`읽지 않은 알림 ${unreadCount}건`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      ),
      onClick: () => {
        togglePanel('notifications')
      },
      match: () => activePanel === 'notifications',
      mobileHidden: true,
      authOnly: true,
    },
  ]

  if (isAdmin) {
    navItems.push({
      to: '/app/admin',
      label: '관리자',
      icon: <ShieldIcon />,
      match: (p) => p.startsWith('/app/admin'),
      adminOnly: true,
    })
  }

  const visibleNavItems = isAuthenticated
    ? navItems
    : navItems.filter((item) => !item.authOnly)

  const isActive = (item: NavItem) => {
    if (item.match) return item.match(location.pathname)
    return location.pathname === item.to
  }

  return (
    <>
    <aside
      className={`${styles.sidebar} ${(moreOpen || activePanel !== null) ? styles.sidebarOpen : ''}`}
      aria-label="주 메뉴"
    >
      <div className={styles.sidebarInner}>
        <Link to="/app" className={styles.brand} aria-label="Sagwim 홈">
          <span className={styles.brandLogoWrap}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={styles.brandLogo} aria-hidden focusable={false}>
              <rect x="4" y="4" width="248" height="248" rx="56" fill="none" stroke="#91A8D0" strokeWidth="4" />
              <g stroke="#91A8D0" strokeWidth="26" strokeLinecap="round" fill="none">
                <path d="M128 78 L72 184" />
                <path d="M128 78 L184 184" />
              </g>
            </svg>
          </span>
        </Link>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {visibleNavItems.map((item) => {
              const active = isActive(item)
              const itemClassName = `${styles.navItem} ${active ? styles.navItemActive : ''}`
              const itemContent = (
                <>
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </>
              )

              const liClassName = [
                item.adminOnly ? styles.adminNavItem : '',
                item.mobileHidden ? styles.mobileHiddenNavItem : '',
                item.desktopHidden ? styles.desktopHiddenNavItem : '',
              ].filter(Boolean).join(' ') || undefined

              return (
                <li key={item.label} className={liClassName}>
                  {item.onClick ? (
                    <button
                      type="button"
                      className={itemClassName}
                      onClick={item.onClick}
                      aria-current={active ? 'page' : undefined}
                    >
                      {itemContent}
                    </button>
                  ) : (
                    <Link
                      to={item.to ?? '#'}
                      className={itemClassName}
                      aria-current={active ? 'page' : undefined}
                    >
                      {itemContent}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className={styles.footer} ref={menuRef}>
          {isAuthenticated ? (
            <>
              <MoreMenuPopover
                isOpen={moreOpen}
                onClose={() => setMoreOpen(false)}
                onLogout={onLogout}
                anchorRef={menuRef}
                placement="sidebar"
              />
              <button
                type="button"
                className={`${styles.navItem} ${styles.moreButton} ${moreOpen ? styles.moreButtonOpen : ''}`}
                onClick={() => setMoreOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
              >
                <span className={styles.navIcon}>
                  <GridEvenMoreIcon />
                </span>
                <span className={styles.navLabel}>더 보기</span>
              </button>
            </>
          ) : (
            <Link to="/login" className={`${styles.navItem} ${styles.moreButton}`}>
              <span className={styles.navIcon}>
                <UserCircleIcon />
              </span>
              <span className={styles.navLabel}>로그인</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
    <SidePanel
      type={activePanel}
      onClose={closePanel}
    />
    </>
  )
}

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'
import { usePostCreateModal } from '../context/PostCreateModalContext'
import { useAuth } from '../context/AuthContext'
import { useNotificationCount } from '../context/NotificationCountContext'
import { CreateTypeSelectorModal } from './common/CreateTypeSelectorModal'
import { SidePanel, type SidePanelType } from './SidePanel'
import { MoreMenuPopover } from './MoreMenuPopover'
import {
  ChatIcon,
  GridEvenMoreIcon,
  HeartIcon,
  HomeIcon,
  PlusSquareIcon,
  SavedIcon,
  SearchIcon,
  ShieldIcon,
  UserCircleIcon,
} from './NavIcons'
import { fetchRooms } from '../api/chatApi'

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
  mobileHidden?: boolean
  desktopHidden?: boolean
}

export function Navbar({ role, onLogout }: NavbarProps) {
  const { meRole, meProfileImageUrl, token } = useAuth()
  const { unreadCount } = useNotificationCount()
  const effectiveRole = role ?? meRole ?? null
  const isAdmin = effectiveRole !== null && ADMIN_ROLES.has(effectiveRole)
  const location = useLocation()
  const navigate = useNavigate()
  const { open: openPostCreateModal, isOpen: isPostCreateModalOpen } = usePostCreateModal()

  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const isOnMessagesPage = location.pathname.startsWith('/app/messages')

  useEffect(() => {
    if (isOnMessagesPage || !token) return

    let cancelled = false

    const load = async () => {
      try {
        const res = await fetchRooms(token, undefined, 50)
        if (!cancelled) {
          const total = res.content.reduce((sum, r) => sum + r.unreadCount, 0)
          setUnreadMessageCount(total)
        }
      } catch {
        // 배지 로딩 실패는 무시
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [token, isOnMessagesPage])

  const [moreOpen, setMoreOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [createFlow, setCreateFlow] = useState<'idle' | 'selecting'>('idle')
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
      icon: <SavedIcon />,
      match: (p) => p.startsWith('/app/posts'),
    },
    {
      label: '만들기',
      icon: <PlusSquareIcon />,
      onClick: () => setCreateFlow('selecting'),
      match: () => isPostCreateModalOpen || createFlow === 'selecting',
      mobileHidden: true,
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
              <rect x="4" y="4" width="248" height="248" rx="56" fill="none" stroke="#f08080" strokeWidth="4" />
              <g stroke="#f08080" strokeWidth="26" strokeLinecap="round" fill="none">
                <path d="M128 78 L72 184" />
                <path d="M128 78 L184 184" />
              </g>
            </svg>
          </span>
        </Link>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {navItems.map((item) => {
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
        </div>
      </div>
      <CreateTypeSelectorModal
        isOpen={createFlow === 'selecting'}
        onClose={() => setCreateFlow('idle')}
        onSelectPost={() => { setCreateFlow('idle'); openPostCreateModal() }}
        onSelectGroup={() => { setCreateFlow('idle'); navigate('/app/groups/new') }}
      />
    </aside>
    <SidePanel
      type={activePanel}
      onClose={closePanel}
    />
    </>
  )
}

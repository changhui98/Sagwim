import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'
import { useTheme } from '../context/ThemeContext'
import { usePostCreateModal } from '../context/PostCreateModalContext'
import { useAuth } from '../context/AuthContext'
import { CreateTypeSelectorModal } from './common/CreateTypeSelectorModal'
import { GroupCreateModal } from './group/GroupCreateModal'
import { SidePanel, type SidePanelType } from './SidePanel'
import { getUnreadCount } from '../api/notificationApi'
import {
  ActivityIcon,
  AlertIcon,
  BookmarkIcon,
  BrandLogo,
  ChevronLeftIcon,
  HomeIcon,
  IdeaIcon,
  LogoutIcon,
  GridEvenMoreIcon,
  MoonIcon,
  PlusSquareIcon,
  SavedIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  SunIcon,
  UserCircleIcon,
} from './NavIcons'

const ADMIN_ROLE = 'ADMIN'

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
}

export function Navbar({ role, onLogout }: NavbarProps) {
  const { meRole, meProfileImageUrl, token, isAuthenticated } = useAuth()
  const effectiveRole = role ?? meRole ?? null
  const isAdmin = effectiveRole === ADMIN_ROLE
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { open: openPostCreateModal, isOpen: isPostCreateModalOpen } = usePostCreateModal()

  const [moreOpen, setMoreOpen] = useState(false)
  const [moreView, setMoreView] = useState<'root' | 'theme'>('root')
  const menuRef = useRef<HTMLDivElement>(null)
  const [createFlow, setCreateFlow] = useState<'idle' | 'selecting' | 'group'>('idle')
  const [activePanel, setActivePanel] = useState<SidePanelType | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  /**
   * 미읽음 알림 수 갱신.
   * - 인증된 상태에서만 호출 (로그아웃 후 401 호출 회피).
   * - 실패 시 사용자에게 노출하지 않고 조용히 무시 (배지 0 유지).
   * - 60초 폴링: 새 탭/세션의 알림을 너무 자주 호출하지 않으면서도 실시간성을 유지하는 절충값.
   */
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !token) return
    try {
      const res = await getUnreadCount(token)
      setUnreadCount(res.count)
    } catch {
      // 네트워크/인증 오류 시 배지를 변경하지 않는다 — UX 깜빡임 방지.
    }
  }, [isAuthenticated, token])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    // 첫 호출도 setInterval 과 동일하게 다음 tick 으로 미뤄, effect 본문에서 직접 동기적으로
    // setState 가 발생하는 것으로 정적 분석되는 패턴(react-hooks/set-state-in-effect)을 회피한다.
    const initialId = window.setTimeout(() => {
      if (!cancelled) void refreshUnreadCount()
    }, 0)
    const intervalId = window.setInterval(() => {
      if (!cancelled) void refreshUnreadCount()
    }, 60_000)
    return () => {
      cancelled = true
      window.clearTimeout(initialId)
      window.clearInterval(intervalId)
    }
  }, [isAuthenticated, refreshUnreadCount])

  // 비로그인 상태에서는 배지를 노출하지 않는다.
  // 별도 setState 로 리셋하지 않고 derived value 로 처리하면 effect 내부 setState 가 사라져
  // cascading re-render 를 회피할 수 있다 (react-hooks/set-state-in-effect 규칙 준수).
  const visibleUnreadCount = useMemo(
    () => (isAuthenticated ? unreadCount : 0),
    [isAuthenticated, unreadCount],
  )

  const togglePanel = useCallback((panel: SidePanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
    // 패널 열릴 때 더 보기 메뉴가 열려 있으면 닫기
    setMoreOpen(false)
    setMoreView('root')
  }, [])

  const closePanel = useCallback(() => {
    setActivePanel(null)
  }, [])

  const closeMenu = useCallback(() => {
    setMoreOpen(false)
    setMoreView('root')
  }, [])

  useEffect(() => {
    if (!moreOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [moreOpen, closeMenu])

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
      onClick: () => togglePanel('search'),
      match: () => activePanel === 'search',
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
      match: () => isPostCreateModalOpen || createFlow !== 'idle',
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
          <IdeaIcon />
          {visibleUnreadCount > 0 && (
            <span
              className={styles.unreadBadge}
              aria-label={`읽지 않은 알림 ${visibleUnreadCount}건`}
            >
              {visibleUnreadCount > 99 ? '99+' : visibleUnreadCount}
            </span>
          )}
        </span>
      ),
      onClick: () => {
        togglePanel('notifications')
        // 알림 패널이 열리는 시점에 최신 카운트를 한 번 더 확인 (60초 폴링 사이의 갭 보완)
        void refreshUnreadCount()
      },
      match: () => activePanel === 'notifications',
    },
  ]

  if (isAdmin) {
    navItems.push({
      to: '/app/admin',
      label: '관리자',
      icon: <ShieldIcon />,
      match: (p) => p.startsWith('/app/admin'),
    })
  }

  const handleLogoutClick = () => {
    closeMenu()
    onLogout()
  }

  const handleModeBack = () => setMoreView('root')

  const goPlaceholder = (label: string) => {
    closeMenu()
    window.alert(`${label} 기능은 준비 중입니다.`)
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
          <BrandLogo className={styles.brandLogo} />
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

              return (
                <li key={item.label}>
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
          {moreOpen && (
            <div
              className={styles.menuPopover}
              role="menu"
              aria-label={moreView === 'root' ? '더 보기' : '모드 전환'}
            >
              {moreView === 'root' ? (
                <>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => goPlaceholder('설정')}
                    role="menuitem"
                  >
                    <span className={styles.menuItemLabel}>설정</span>
                    <SettingsIcon className={styles.menuItemIcon} />
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => goPlaceholder('내 활동')}
                    role="menuitem"
                  >
                    <span className={styles.menuItemLabel}>내 활동</span>
                    <ActivityIcon className={styles.menuItemIcon} />
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => goPlaceholder('저장됨')}
                    role="menuitem"
                  >
                    <span className={styles.menuItemLabel}>저장됨</span>
                    <BookmarkIcon className={styles.menuItemIcon} />
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => setMoreView('theme')}
                    role="menuitem"
                  >
                    <span className={styles.menuItemLabel}>모드 전환</span>
                    {theme === 'dark' ? (
                      <MoonIcon className={styles.menuItemIcon} />
                    ) : (
                      <SunIcon className={styles.menuItemIcon} />
                    )}
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => goPlaceholder('문제 신고')}
                    role="menuitem"
                  >
                    <span className={styles.menuItemLabel}>문제 신고</span>
                    <AlertIcon className={styles.menuItemIcon} />
                  </button>

                  <div className={styles.menuDivider} />

                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    onClick={handleLogoutClick}
                    role="menuitem"
                  >
                    <span className={styles.menuItemLabel}>로그아웃</span>
                    <LogoutIcon className={styles.menuItemIcon} />
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.menuHeader}>
                    <button
                      type="button"
                      className={styles.menuBack}
                      onClick={handleModeBack}
                      aria-label="뒤로"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <span className={styles.menuHeaderTitle}>모드 전환</span>
                    <span className={styles.menuHeaderIcon} aria-hidden>
                      {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
                    </span>
                  </div>
                  <div className={styles.menuDivider} />
                  <div className={styles.menuToggleRow}>
                    <span className={styles.menuItemLabel}>다크 모드</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={theme === 'dark'}
                      className={`${styles.toggleSwitch} ${theme === 'dark' ? styles.toggleSwitchOn : ''}`}
                      onClick={toggleTheme}
                    >
                      <span className={styles.toggleKnob} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            className={`${styles.navItem} ${styles.moreButton} ${moreOpen ? styles.moreButtonOpen : ''}`}
            onClick={() => {
              setMoreView('root')
              setMoreOpen((v) => !v)
            }}
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
        onSelectGroup={() => setCreateFlow('group')}
      />
      <GroupCreateModal
        isOpen={createFlow === 'group'}
        onClose={() => setCreateFlow('idle')}
        onCreated={(groupId) => { setCreateFlow('idle'); navigate(`/app/groups/${groupId}`) }}
      />
    </aside>
    <SidePanel
      type={activePanel}
      onClose={closePanel}
      onNotificationsChange={() => { void refreshUnreadCount() }}
    />
    </>
  )
}

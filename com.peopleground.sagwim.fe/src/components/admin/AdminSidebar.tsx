import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getInitials } from '../../utils/stringUtils'
import type { UserDetailResponse } from '../../types/user'
import styles from './AdminSidebar.module.css'

/* ── 메뉴 아이콘 (라인 스타일, currentColor 상속) ── */
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const ICONS = {
  dashboard: (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  chart: (
    <svg {...iconProps}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m7 14 3-4 3 3 4-6" />
    </svg>
  ),
  users: (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  group: (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20v-1a6 6 0 0 1 12 0v1" />
      <circle cx="18" cy="7" r="2.5" />
      <path d="M16 14.5a5 5 0 0 1 5 4.5" />
    </svg>
  ),
  post: (
    <svg {...iconProps}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  ),
  image: (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-4.5-4.5L5 21" />
    </svg>
  ),
  report: (
    <svg {...iconProps}>
      <path d="M4 21V4" />
      <path d="M4 4h13l-2.5 4L17 12H4" />
    </svg>
  ),
  ban: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </svg>
  ),
  service: (
    <svg {...iconProps}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  log: (
    <svg {...iconProps}>
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  ),
} satisfies Record<string, ReactNode>

interface MenuItem {
  path: string
  label: string
  icon: ReactNode
}

interface MenuSection {
  title: string
  items: readonly MenuItem[]
}

const MENU_SECTIONS: readonly MenuSection[] = [
  {
    title: '대시보드',
    items: [
      { path: '/app/admin', label: 'Dashboard', icon: ICONS.dashboard },
      { path: '/app/admin/charts', label: '차트', icon: ICONS.chart },
    ],
  },
  {
    title: '운영',
    items: [
      { path: '/app/admin/users', label: '사용자 관리', icon: ICONS.users },
      { path: '/app/admin/groups', label: '모임 관리', icon: ICONS.group },
      { path: '/app/admin/posts', label: '게시글 관리', icon: ICONS.post },
      { path: '/app/admin/images', label: '이미지 관리', icon: ICONS.image },
    ],
  },
  {
    title: '안전',
    items: [
      { path: '/app/admin/reports', label: '신고 내역', icon: ICONS.report },
      {
        path: '/app/admin/forbidden-words',
        label: '금지 단어',
        icon: ICONS.ban,
      },
    ],
  },
  {
    title: '시스템',
    items: [
      {
        path: '/app/admin/inquiries',
        label: '서비스 관리',
        icon: ICONS.service,
      },
      { path: '/app/admin/logs', label: '로그', icon: ICONS.log },
    ],
  },
] as const

interface ProfileAvatarProps {
  profile: UserDetailResponse
}

function ProfileAvatar({ profile }: ProfileAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const imageUrl = profile.profileImageUrl?.trim()

  useEffect(() => {
    setImgError(false)
  }, [imageUrl])

  return (
    <span className={`avatar avatar-lg ${styles.profileAvatar}`}>
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt={`${profile.nickname} 프로필`}
          className={styles.profileAvatarImg}
          onError={() => setImgError(true)}
        />
      ) : (
        getInitials(profile.nickname)
      )}
    </span>
  )
}

interface AdminSidebarProps {
  profile: UserDetailResponse | null
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const location = useLocation()

  const isActive = (path: string): boolean => {
    if (path === '/app/admin') {
      return location.pathname === '/app/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <aside className={styles.sidebar}>
      {profile && (
        <div className={styles.profileSection}>
          <ProfileAvatar profile={profile} />
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{profile.nickname}</span>
            <span className={styles.profileRole}>Administrator</span>
          </div>
        </div>
      )}

      <nav className={styles.nav}>
        {MENU_SECTIONS.map((section) => (
          <div key={section.title} className={styles.section}>
            <span className={styles.sectionTitle}>{section.title}</span>

            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={
                  isActive(item.path) ? styles.menuItemActive : styles.menuItem
                }
              >
                <span className={styles.menuIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={styles.menuLabel}>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

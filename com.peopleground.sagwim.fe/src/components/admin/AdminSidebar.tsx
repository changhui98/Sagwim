import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getInitials } from '../../utils/stringUtils'
import type { UserDetailResponse } from '../../types/user'
import styles from './AdminSidebar.module.css'
import crownIcon from '../../assets/crown-svgrepo-com.svg'
import usersIcon from '../../assets/users-svgrepo-com.svg'
import groupIcon from '../../assets/heart-alt-svgrepo-com.svg'
import clipboardIcon from '../../assets/clipboard-list-alt-svgrepo-com.svg'
import pictureIcon from '../../assets/picture-svgrepo-com.svg'
import reportIcon from '../../assets/square-list-svgrepo-com.svg'
import forbiddenIcon from '../../assets/xmark-svgrepo-com.svg'
import inquiryIcon from '../../assets/bulb-svgrepo-com.svg'
import logIcon from '../../assets/clipboard-heart-svgrepo-com.svg'

interface MenuItem {
  path: string
  label: string
  icon: string
}

const MENU_ITEMS: readonly MenuItem[] = [
  { path: '/app/admin', label: 'Dashboard', icon: crownIcon },
  { path: '/app/admin/users', label: '사용자 관리', icon: usersIcon },
  { path: '/app/admin/groups', label: '모임 관리', icon: groupIcon },
  { path: '/app/admin/posts', label: '게시글 관리', icon: clipboardIcon },
  { path: '/app/admin/images', label: '이미지 관리', icon: pictureIcon },
  { path: '/app/admin/reports', label: '신고 내역', icon: reportIcon },
  { path: '/app/admin/forbidden-words', label: '금지 단어', icon: forbiddenIcon },
  { path: '/app/admin/inquiries', label: '서비스 관리', icon: inquiryIcon },
  { path: '/app/admin/logs', label: '로그', icon: logIcon },
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
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={
              isActive(item.path) ? styles.menuItemActive : styles.menuItem
            }
          >
            <img src={item.icon} alt={item.label} className={styles.menuIcon} />
            <span className={styles.menuLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

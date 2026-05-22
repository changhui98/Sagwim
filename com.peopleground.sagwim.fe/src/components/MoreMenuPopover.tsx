import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import {
  ActivityIcon,
  AlertIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  LogoutIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from './NavIcons'
import styles from './MoreMenuPopover.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
  anchorRef: RefObject<HTMLElement | null>
  placement?: 'sidebar' | 'header'
}

export function MoreMenuPopover({ isOpen, onClose, onLogout, anchorRef, placement = 'sidebar' }: Props) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [view, setView] = useState<'root' | 'theme'>('root')
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) setView('root')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, anchorRef])

  const go = (path: string) => { onClose(); navigate(path) }
  const placeholder = (label: string) => { onClose(); window.alert(`${label} 기능은 준비 중입니다.`) }
  const handleLogout = () => { onClose(); onLogout() }

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      className={`${styles.popover} ${placement === 'header' ? styles.popoverHeader : styles.popoverSidebar}`}
      role="menu"
      aria-label={view === 'root' ? '더 보기' : '모드 전환'}
    >
      {view === 'root' ? (
        <>
          <button type="button" className={styles.item} onClick={() => go('/app/settings')} role="menuitem">
            <span className={styles.itemLabel}>설정</span>
            <SettingsIcon className={styles.itemIcon} />
          </button>
          <button type="button" className={styles.item} onClick={() => go('/app/activity')} role="menuitem">
            <span className={styles.itemLabel}>내 활동</span>
            <ActivityIcon className={styles.itemIcon} />
          </button>
          <button type="button" className={styles.item} onClick={() => placeholder('저장됨')} role="menuitem">
            <span className={styles.itemLabel}>저장됨</span>
            <BookmarkIcon className={styles.itemIcon} />
          </button>
          <button type="button" className={styles.item} onClick={() => setView('theme')} role="menuitem">
            <span className={styles.itemLabel}>모드 전환</span>
            {theme === 'dark' ? <MoonIcon className={styles.itemIcon} /> : <SunIcon className={styles.itemIcon} />}
          </button>
          <button type="button" className={styles.item} onClick={() => placeholder('문제 신고')} role="menuitem">
            <span className={styles.itemLabel}>문제 신고</span>
            <AlertIcon className={styles.itemIcon} />
          </button>
          <div className={styles.divider} />
          <button type="button" className={`${styles.item} ${styles.itemDanger}`} onClick={handleLogout} role="menuitem">
            <span className={styles.itemLabel}>로그아웃</span>
            <LogoutIcon className={styles.itemIcon} />
          </button>
        </>
      ) : (
        <>
          <div className={styles.menuHeader}>
            <button type="button" className={styles.back} onClick={() => setView('root')} aria-label="뒤로">
              <ChevronLeftIcon />
            </button>
            <span className={styles.headerTitle}>모드 전환</span>
            <span className={styles.headerIcon} aria-hidden>
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </span>
          </div>
          <div className={styles.divider} />
          <div className={styles.toggleRow}>
            <span className={styles.itemLabel}>다크 모드</span>
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              className={`${styles.toggle} ${theme === 'dark' ? styles.toggleOn : ''}`}
              onClick={toggleTheme}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

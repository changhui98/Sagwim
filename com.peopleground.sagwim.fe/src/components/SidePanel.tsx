import { useEffect, useRef } from 'react'
import { SearchContent } from './search/SearchContent'
import { NotificationsContent } from './notifications/NotificationsContent'
import styles from './SidePanel.module.css'

export type SidePanelType = 'search' | 'notifications'

interface SidePanelProps {
  type: SidePanelType | null
  onClose: () => void
  /**
   * 알림 패널 내에서 읽음 처리가 발생했을 때 부모(Navbar)가 미읽음 카운트를 다시 가져오도록 트리거한다.
   * NotificationCountContext 도입 후에는 호출되지 않아도 무방하나, API 호환성을 위해 유지한다.
   * @deprecated NotificationCountContext에서 직접 처리하므로 제거 예정.
   */
  onNotificationsChange?: () => void
}

const PANEL_TITLES: Record<SidePanelType, string> = {
  search: '검색',
  notifications: '알림',
}

export function SidePanel({ type, onClose }: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const isOpen = type !== null

  // 외부 클릭으로 닫기 — 사이드바(aside) 클릭은 제외
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      // 사이드바(모바일 탭바) 또는 데스크톱 헤더 클릭은 외부 클릭으로 보지 않음
      const sidebar = document.querySelector('aside[aria-label="주 메뉴"]')
      if (sidebar?.contains(target)) return
      const header = document.querySelector('header[data-app-header]')
      if (header?.contains(target)) return
      onClose()
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
  }, [isOpen, onClose])

  const title = type ? PANEL_TITLES[type] : undefined

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      aria-hidden={!isOpen}
    >
      {type && (
        <>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>{title}</h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="패널 닫기"
            >
              <CloseIcon />
            </button>
          </div>
          {type === 'search' && <SearchContent onClose={onClose} />}
          {type === 'notifications' && <NotificationsContent onClose={onClose} />}
        </>
      )}
    </div>
  )
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

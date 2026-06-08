import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { UserRole } from '../../types/user'
import styles from './RoleDropdown.module.css'

const ROLE_OPTIONS: UserRole[] = ['USER', 'MANAGER']

interface RoleDropdownProps {
  role: UserRole
  disabled?: boolean
  onChange: (role: UserRole) => void
}

/**
 * 역할 선택 커스텀 드롭다운.
 * 메뉴는 overflow 컨테이너(테이블 가로 스크롤 영역)에 잘리지 않도록
 * createPortal + 트리거 좌표 기반 fixed 위치로 렌더링한다.
 */
export function RoleDropdown({ role, disabled = false, onChange }: RoleDropdownProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [])

  useLayoutEffect(() => {
    if (open) updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return
      }
      setOpen(false)
    }
    const handleClose = () => setOpen(false)
    document.addEventListener('mousedown', handleClickOutside)
    // 스크롤/리사이즈 시 좌표가 어긋나므로 닫는다(capture로 내부 스크롤도 감지).
    window.addEventListener('scroll', handleClose, true)
    window.addEventListener('resize', handleClose)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleClose, true)
      window.removeEventListener('resize', handleClose)
    }
  }, [open])

  const toneClass =
    role === 'ADMIN'
      ? styles.triggerAdmin
      : role === 'MANAGER'
        ? styles.triggerManager
        : styles.triggerUser

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        className={`${styles.trigger} ${toneClass}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        <span>{role}</span>
        <svg
          className={styles.chevron}
          data-open={open}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open &&
        menuPos &&
        createPortal(
          <ul
            ref={menuRef}
            className={styles.menu}
            role="listbox"
            style={{ top: menuPos.top, left: menuPos.left, minWidth: menuPos.width }}
            onClick={(e) => e.stopPropagation()}
          >
            {ROLE_OPTIONS.map((opt) => {
              const active = opt === role
              return (
                <li key={opt} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={active ? styles.itemActive : styles.item}
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpen(false)
                      if (!active) onChange(opt)
                    }}
                  >
                    {opt}
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body,
        )}
    </>
  )
}

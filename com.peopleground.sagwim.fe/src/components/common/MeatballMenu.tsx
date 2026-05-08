import { useEffect, useRef, useState } from 'react'
import { MenuMeatballsIcon } from '../NavIcons'
import styles from './MeatballMenu.module.css'

export interface MeatballMenuItem {
  label: string
  danger?: boolean
  onClick: () => void
}

interface MeatballMenuProps {
  items: MeatballMenuItem[]
  /** 버튼 aria-label (기본: "메뉴") */
  ariaLabel?: string
  /** 아이콘 크기 (기본: 18) */
  iconSize?: number
  /** 버튼 크기 클래스 — 'sm' (26px) | 'md' (32px, 기본) */
  size?: 'sm' | 'md'
}

/**
 * 공통 미트볼(⋯) 드롭다운 메뉴.
 * - ESC / 외부 클릭으로 닫힘
 * - 키보드 포커스 가능 (role="menu")
 * - 댓글·게시글 카드 양쪽에서 재사용
 */
export function MeatballMenu({
  items,
  ariaLabel = '메뉴',
  iconSize = 18,
  size = 'md',
}: MeatballMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.btn} ${size === 'sm' ? styles.btnSm : styles.btnMd}`}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MenuMeatballsIcon width={iconSize} height={iconSize} />
      </button>

      {open && (
        <div
          className={styles.popover}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`${styles.item} ${item.danger ? styles.itemDanger : ''}`}
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './AdminPageHeader.module.css'

export interface SearchFieldOption {
  value: string
  label: string
}

interface AdminPageHeaderProps {
  title: string
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  /** 검색 대상 필드 옵션. 주어지면 검색창 왼쪽에 드롭다운이 표시된다. 단일 검색이면 생략. */
  searchFields?: readonly SearchFieldOption[]
  searchField?: string
  onSearchFieldChange?: (value: string) => void
  /** 우측 액션 슬롯 (예: "추가" 버튼). 없으면 검색창이 우측까지 확장된다. */
  children?: ReactNode
}

/** 검색 대상 선택 커스텀 드롭다운 (항상 아래로 펼쳐지며 서비스 톤에 맞춘 디자인) */
function SearchFieldDropdown({
  fields,
  value,
  onChange,
}: {
  fields: readonly SearchFieldOption[]
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = fields.find((f) => f.value === value) ?? fields[0]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className={styles.dropdown} ref={ref}>
      <button
        type="button"
        className={styles.dropdownTrigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current.label}
        <svg
          className={styles.chevron}
          data-open={open}
          width="14"
          height="14"
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
      {open && (
        <ul className={styles.dropdownMenu} role="listbox">
          {fields.map((f) => {
            const active = f.value === value
            return (
              <li key={f.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={active ? styles.menuItemActive : styles.menuItem}
                  onClick={() => {
                    onChange(f.value)
                    setOpen(false)
                  }}
                >
                  {f.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * 관리자 페이지 공통 헤더: 제목 | (선택) 검색 필드 드롭다운 + 검색창 | (선택) 우측 액션.
 * 검색 상태/디바운스는 호출하는 페이지가 관리한다(useDebouncedValue 권장).
 */
export function AdminPageHeader({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchFields,
  searchField,
  onSearchFieldChange,
  children,
}: AdminPageHeaderProps) {
  const hasFields = searchFields && searchFields.length > 0
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.search}>
        <div className={styles.searchGroup}>
          {hasFields && (
            <>
              <SearchFieldDropdown
                fields={searchFields}
                value={searchField ?? searchFields[0].value}
                onChange={(v) => onSearchFieldChange?.(v)}
              />
              <span className={styles.divider} aria-hidden="true" />
            </>
          )}
          <div className={styles.searchBox}>
            <svg
              className={styles.searchIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

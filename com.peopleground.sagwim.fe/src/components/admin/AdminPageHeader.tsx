import type { ReactNode } from 'react'
import styles from './AdminPageHeader.module.css'

interface AdminPageHeaderProps {
  title: string
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  /** 우측 액션 슬롯 (예: "추가" 버튼). 없으면 검색창이 우측까지 확장된다. */
  children?: ReactNode
}

/**
 * 관리자 페이지 공통 헤더: 제목 | 검색창 | (선택) 우측 액션.
 * 검색 상태/디바운스는 호출하는 페이지가 관리한다(useDebouncedValue 권장).
 */
export function AdminPageHeader({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.search}>
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
      {children}
    </div>
  )
}

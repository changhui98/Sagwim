import styles from './HomeTopBar.module.css'

interface HomeTopBarProps {
  /** 현재 동네 라벨 (예: "내발산동") */
  regionLabel: string | null
  /** 위치 칩 클릭 (주소 수정 이동) */
  onLocationClick: () => void
  /** 검색바 클릭 (검색 페이지 이동) */
  onSearchClick: () => void
}

export function HomeTopBar({ regionLabel, onLocationClick, onSearchClick }: HomeTopBarProps) {
  return (
    <div className={styles.topBar}>
      <button type="button" className={styles.location} onClick={onLocationClick}>
        <svg className={styles.pinIcon} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
          />
        </svg>
        <span className={styles.locationText}>{regionLabel ?? '내 동네'}</span>
        <svg className={styles.chevron} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <button type="button" className={styles.search} onClick={onSearchClick}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={styles.searchPlaceholder}>관심사로 모임 찾기</span>
      </button>
    </div>
  )
}

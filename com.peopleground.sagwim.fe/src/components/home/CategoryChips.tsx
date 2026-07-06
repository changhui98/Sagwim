import { useCallback, useEffect, useRef, useState } from 'react'
import { CHIP_KEYS, chipEmoji, chipLabel, chipTone, type CategoryChipKey } from './categoryFilter'
import styles from './CategoryChips.module.css'

interface CategoryChipsProps {
  active: CategoryChipKey
  onChange: (key: CategoryChipKey) => void
}

export function CategoryChips({ active, onChange }: CategoryChipsProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [fadeLeft, setFadeLeft] = useState(false)
  const [fadeRight, setFadeRight] = useState(false)

  const updateFades = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setFadeLeft(el.scrollLeft > 1)
    setFadeRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  useEffect(() => {
    updateFades()
    const el = trackRef.current
    if (!el) return
    const observer = new ResizeObserver(updateFades)
    observer.observe(el)
    return () => observer.disconnect()
  }, [updateFades])

  // 선택된 칩이 화면 밖에 있으면 트랙 안으로 스크롤
  useEffect(() => {
    trackRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  }, [active])

  return (
    <div className={styles.chipsWrap}>
      <div className={`${styles.fade} ${styles.fadeLeft} ${fadeLeft ? styles.fadeVisible : ''}`} aria-hidden="true" />
      <div className={`${styles.fade} ${styles.fadeRight} ${fadeRight ? styles.fadeVisible : ''}`} aria-hidden="true" />
      <div
        ref={trackRef}
        className={styles.chips}
        role="tablist"
        aria-label="모임 카테고리 필터"
        onScroll={updateFades}
      >
        {CHIP_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active === key}
            data-tone={chipTone(key)}
            className={`${styles.chip} ${active === key ? styles.chipActive : ''}`}
            onClick={() => onChange(key)}
          >
            <span className={styles.chipEmoji} aria-hidden="true">
              {chipEmoji(key)}
            </span>
            {chipLabel(key)}
          </button>
        ))}
      </div>
    </div>
  )
}

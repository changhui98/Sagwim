import { useEffect, useRef, useState } from 'react'
import { CHIP_KEYS, chipLabel, type CategoryChipKey } from './categoryFilter'
import styles from './CategoryChips.module.css'

interface CategoryChipsProps {
  active: CategoryChipKey
  onChange: (key: CategoryChipKey) => void
}

export function CategoryChips({ active, onChange }: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  // effect에서는 외부 시스템(스크롤/리사이즈) 구독만 하고, 측정값 setState는 콜백에서만 호출
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      setCanLeft(el.scrollLeft > 1)
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }
    el.addEventListener('scroll', update, { passive: true })
    // ResizeObserver는 observe 직후 콜백을 한 번 비동기로 호출하므로 초기 측정도 여기서 처리됨
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  const scrollByDir = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.chips} ref={scrollRef} role="tablist" aria-label="모임 카테고리 필터">
        {CHIP_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active === key}
            className={`${styles.chip} ${active === key ? styles.chipActive : ''}`}
            onClick={() => onChange(key)}
          >
            {chipLabel(key)}
          </button>
        ))}
      </div>

      <div className={`${styles.fade} ${styles.fadeLeft} ${canLeft ? styles.fadeVisible : ''}`} aria-hidden="true" />
      <button
        type="button"
        className={`${styles.nav} ${styles.navLeft} ${canLeft ? styles.navVisible : ''}`}
        onClick={() => scrollByDir(-1)}
        aria-label="이전 카테고리 보기"
        tabIndex={canLeft ? 0 : -1}
      >
        ‹
      </button>

      <div className={`${styles.fade} ${styles.fadeRight} ${canRight ? styles.fadeVisible : ''}`} aria-hidden="true" />
      <button
        type="button"
        className={`${styles.nav} ${styles.navRight} ${canRight ? styles.navVisible : ''}`}
        onClick={() => scrollByDir(1)}
        aria-label="다음 카테고리 보기"
        tabIndex={canRight ? 0 : -1}
      >
        ›
      </button>
    </div>
  )
}

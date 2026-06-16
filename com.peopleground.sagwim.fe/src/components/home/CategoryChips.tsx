import { CHIP_KEYS, chipLabel, type CategoryChipKey } from './categoryFilter'
import styles from './CategoryChips.module.css'

interface CategoryChipsProps {
  active: CategoryChipKey
  onChange: (key: CategoryChipKey) => void
}

export function CategoryChips({ active, onChange }: CategoryChipsProps) {
  return (
    <div className={styles.chips} role="tablist" aria-label="모임 카테고리 필터">
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
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { GROUP_CATEGORY_LABELS } from '../../types/group'
import type { GroupResponse } from '../../types/group'
import styles from './RecommendCarousel.module.css'

interface RecommendCarouselProps {
  /** 캐러셀에 노출할 추천 모임 (상위 N개) */
  groups: GroupResponse[]
  /** 모임 상세로 이동 */
  onNavigate: (groupId: number) => void
}

const AUTO_INTERVAL = 4000

export function RecommendCarousel({ groups, onNavigate }: RecommendCarouselProps) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef<number | undefined>(undefined)

  const stop = useCallback(() => {
    if (timerRef.current !== undefined) {
      window.clearInterval(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  const start = useCallback(() => {
    stop()
    if (groups.length <= 1) return
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % groups.length)
    }, AUTO_INTERVAL)
  }, [groups.length, stop])

  // 자동 전환 시작/정리
  useEffect(() => {
    start()
    return stop
  }, [start, stop])

  if (groups.length === 0) return null

  // groups 개수가 줄어도 안전하도록 렌더 시 인덱스 보정 (effect 대신 파생값)
  const current = index % groups.length

  const goTo = (i: number) => {
    setIndex(i)
    start() // 수동 이동 시 타이머 리셋
  }
  const prev = () => goTo((current - 1 + groups.length) % groups.length)
  const next = () => goTo((current + 1) % groups.length)

  return (
    <section
      className={styles.carousel}
      onMouseEnter={stop}
      onMouseLeave={start}
      aria-roledescription="carousel"
    >
      <div className={styles.viewport}>
        {groups.map((g, i) => (
          <div
            key={g.id}
            className={`${styles.slide} ${i === current ? styles.slideActive : ''} ${g.imageUrl ? '' : styles.slideNoImage}`}
            style={g.imageUrl ? { backgroundImage: `url(${g.imageUrl})` } : undefined}
            aria-hidden={i !== current}
          >
            {!g.imageUrl && <div className={styles.placeholder} aria-hidden="true">🏠</div>}
            <div className={styles.scrim} />
            <span className={styles.badge}>{GROUP_CATEGORY_LABELS[g.category]}</span>
            <div className={styles.content}>
              <div className={styles.textCol}>
                <p className={styles.eyebrow}>이번 주 추천 · 내 동네</p>
                <h3 className={styles.title}>{g.name}</h3>
                <p className={styles.meta}>{g.currentMemberCount}/{g.maxMemberCount}명 참여중</p>
              </div>
              <button
                type="button"
                className={styles.joinBtn}
                onClick={() => onNavigate(g.id)}
              >
                참여하기
              </button>
            </div>
          </div>
        ))}
      </div>

      {groups.length > 1 && (
        <>
          <button type="button" className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="이전 추천">
            ‹
          </button>
          <button type="button" className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="다음 추천">
            ›
          </button>
          <div className={styles.dots}>
            {groups.map((g, i) => (
              <button
                key={g.id}
                type="button"
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => goTo(i)}
                aria-label={`${i + 1}번째 추천 보기`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

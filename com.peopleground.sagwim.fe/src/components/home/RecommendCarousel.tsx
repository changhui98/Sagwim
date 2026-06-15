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
      <div className={styles.header}>
        <svg className={styles.headerIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable={false}>
          <path d="M12 2c.4 3-1.5 4.5-2.8 5.9C7.7 9.5 7 11 7 12.8a5 5 0 0 0 10 .2c0-1.6-.6-3-1.6-4.2-.3 1-.9 1.7-1.8 2C14.3 8 14 5.4 12 2Z" />
        </svg>
        <span className={styles.headerText}>이번 주 추천 · 내 동네</span>
      </div>

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

        {groups.length > 1 && (
          <>
            <button type="button" className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="이전 추천">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button type="button" className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="다음 추천">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
                <path d="M9 18l6-6-6-6" />
              </svg>
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
      </div>
    </section>
  )
}

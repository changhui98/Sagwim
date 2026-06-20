import type { ReactNode } from 'react'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import styles from './ValueSection.module.css'

interface ValueItem {
  icon: ReactNode
  title: string
  desc: string
}

const VALUES: ValueItem[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
    title: '걸어서 닿는 거리',
    desc: '우리 동네, 가까운 이웃부터. 멀리 가지 않아도 만날 사람이 많아요.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 20.5s-7-4.3-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 3.1c0 5.1-7 9.4-7 9.4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: '취향이 닿는 사람',
    desc: '운동, 독서, 맛집, 게임까지. 좋아하는 게 같은 사람과 자연스럽게 이어져요.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3.5l2.1 4.6 5 .6-3.7 3.4 1 5-4.4-2.5L7.6 17l1-5L4.9 8.7l5-.6L12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: '부담 없는 시작',
    desc: '클릭 몇 번이면 충분해요. 모임 가입도, 새 모임 만들기도 가볍게.',
  },
]

export function ValueSection() {
  const { ref, hasRevealed } = useRevealOnScroll()

  return (
    <section className={styles.section}>
      <div
        ref={ref}
        className={`${styles.inner} ${hasRevealed ? styles.revealed : ''}`}
      >
        <header className={styles.head}>
          <h2 className={styles.title}>동네가 더 가까워지는 이유</h2>
          <p className={styles.lead}>
            사귐은 멀리 있는 친구가 아니라, 가까운 이웃과의 만남을 돕습니다.
          </p>
        </header>

        <div className={styles.grid}>
          {VALUES.map((v, i) => (
            <article
              key={v.title}
              className={styles.card}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <span className={styles.iconWrap}>{v.icon}</span>
              <h3 className={styles.cardTitle}>{v.title}</h3>
              <p className={styles.cardDesc}>{v.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

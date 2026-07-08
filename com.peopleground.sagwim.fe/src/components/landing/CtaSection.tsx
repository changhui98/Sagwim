import { Link } from 'react-router-dom'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import styles from './CtaSection.module.css'

interface CtaSectionProps {
  isAuthenticated: boolean
}

/**
 * 페이지 말미 가입/전환 CTA. 회원에게는 "모임 생성" 전환을 유도한다
 * (히어로는 둘러보기 우선 — 역할을 뒤집어 중복감을 피한다).
 */
export function CtaSection({ isAuthenticated }: CtaSectionProps) {
  const { ref, hasRevealed } = useRevealOnScroll()

  const title = isAuthenticated ? (
    <>
      오늘, 우리 동네에서
      <br />
      새로운 모임을 열어보세요
    </>
  ) : (
    <>
      오늘, 우리 동네에서
      <br />첫 모임을 시작해 보세요
    </>
  )
  const desc = isAuthenticated
    ? '마음 맞는 이웃이 기다리고 있어요. 모임을 만드는 데 1분이면 충분해요.'
    : '가입은 1분이면 충분해요. 가까운 이웃이 기다리고 있어요.'
  const primary = isAuthenticated
    ? { to: '/app/groups/new', label: '새 모임 만들기' }
    : { to: '/sign-up', label: '무료로 시작하기' }
  const secondary = isAuthenticated
    ? { to: '/app/groups', label: '모임 둘러보기' }
    : { to: '/login', label: '이미 회원이에요' }

  return (
    <section className={styles.section}>
      <div
        ref={ref}
        className={`${styles.banner} ${hasRevealed ? styles.revealed : ''}`}
      >
        <span className={styles.titleBar} aria-hidden />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.desc}>{desc}</p>
        <div className={styles.actions}>
          <Link to={primary.to} className={`${styles.btnPrimary} btn btn-lg`}>
            {primary.label}
            <span className={styles.arrow} aria-hidden>
              →
            </span>
          </Link>
          <Link to={secondary.to} className={`${styles.btnSecondary} btn btn-lg`}>
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  )
}

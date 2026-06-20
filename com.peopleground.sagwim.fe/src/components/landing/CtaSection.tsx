import { Link } from 'react-router-dom'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import styles from './CtaSection.module.css'

export function CtaSection() {
  const { ref, hasRevealed } = useRevealOnScroll()

  return (
    <section className={styles.section}>
      <div
        ref={ref}
        className={`${styles.banner} ${hasRevealed ? styles.revealed : ''}`}
      >
        <h2 className={styles.title}>
          오늘, 우리 동네에서
          <br />첫 모임을 시작해 보세요
        </h2>
        <p className={styles.desc}>
          가입은 1분이면 충분해요. 가까운 이웃이 기다리고 있어요.
        </p>
        <div className={styles.actions}>
          <Link to="/sign-up" className={`${styles.btn} btn btn-lg`}>
            무료로 시작하기
          </Link>
          <Link to="/login" className={`${styles.btn} ${styles.ghost} btn btn-lg`}>
            이미 회원이에요
          </Link>
        </div>
      </div>
    </section>
  )
}

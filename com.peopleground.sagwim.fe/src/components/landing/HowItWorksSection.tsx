import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import styles from './HowItWorksSection.module.css'

const STEPS = [
  {
    no: '01',
    title: '가입하고 동네 설정',
    desc: '간단한 회원가입으로 시작해요. 우리 동네만 정하면 준비 끝.',
  },
  {
    no: '02',
    title: '모임 찾고, 만들기',
    desc: '관심사로 모임을 둘러보거나, 마음에 드는 게 없으면 직접 만들어요.',
  },
  {
    no: '03',
    title: '이웃과 함께하기',
    desc: '채팅으로 약속을 잡고, 게시판에 일상을 나누며 가까워져요.',
  },
]

export function HowItWorksSection() {
  const { ref, hasRevealed } = useRevealOnScroll()

  return (
    <section className={styles.section}>
      <div
        ref={ref}
        className={`${styles.inner} ${hasRevealed ? styles.revealed : ''}`}
      >
        <header className={styles.head}>
          <h2 className={styles.title}>이렇게 시작해요</h2>
          <span className={styles.titleBar} aria-hidden />
          <p className={styles.lead}>세 단계면 동네 이웃과 이어집니다.</p>
        </header>

        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li
              key={s.no}
              className={styles.step}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <span className={styles.no}>{s.no}</span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

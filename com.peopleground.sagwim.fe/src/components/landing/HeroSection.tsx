import { Link } from 'react-router-dom'
import { KoreaMapVisual } from './KoreaMapVisual'
import styles from './HeroSection.module.css'

interface HeroSectionProps {
  isAuthenticated: boolean
  nickname: string | null
}

/**
 * 랜딩 첫 화면. 좌측 카피·CTA, 우측 한반도 연결 비주얼.
 * 로그인 여부에 따라 인사말·카피·CTA를 회원용으로 전환한다.
 * 모바일에서는 비주얼이 위로, 카피가 아래로 세로 스택된다.
 */
export function HeroSection({ isAuthenticated, nickname }: HeroSectionProps) {
  // 닉네임은 /users/me 비동기 로드 — 폴백 치환이라 레이아웃 점프 없음
  const eyebrow = isAuthenticated
    ? `${nickname ?? '이웃'}님, 다시 만나서 반가워요`
    : '이웃과 함께하는 동네 모임'
  const primary = isAuthenticated
    ? { to: '/app/groups', label: '모임 둘러보기' }
    : { to: '/sign-up', label: '지금 시작하기' }
  const secondary = isAuthenticated
    ? { to: '/app/groups/new', label: '새 모임 만들기' }
    : { to: '/login', label: '로그인' }

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h1 className={styles.title}>
            가까운 동네에서
            <br />
            마음 맞는 <span className={styles.accent}>이웃</span>을 만나요
          </h1>
          <p className={styles.subtitle}>
            {isAuthenticated ? (
              <>
                오늘도 우리 동네 곳곳에서 새로운 모임이 열리고 있어요. 취향이
                닿는 모임에 참여하거나, 직접 첫 모임을 열어보세요.
              </>
            ) : (
              <>
                우리 동네 곳곳의 사람들이{' '}
                <span className={styles.brand}>사귐</span>으로 이어집니다.
                취향이 닿는 모임을 찾고, 이야기를 나누고, 실시간으로 소통해
                보세요.
              </>
            )}
          </p>
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

        <div className={styles.visual}>
          <KoreaMapVisual />
        </div>
      </div>
    </section>
  )
}

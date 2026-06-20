import { Link } from 'react-router-dom'
import { KoreaMapVisual } from './KoreaMapVisual'
import styles from './HeroSection.module.css'

/**
 * 랜딩 첫 화면. 좌측 카피·CTA, 우측 한반도 연결 비주얼.
 * 모바일에서는 비주얼이 위로, 카피가 아래로 세로 스택된다.
 */
export function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>이웃과 함께하는 동네 모임</span>
          <h1 className={styles.title}>
            가까운 동네에서
            <br />
            마음 맞는 <span className={styles.accent}>이웃</span>을 만나요
          </h1>
          <p className={styles.subtitle}>
            우리 동네 곳곳의 사람들이 <span className={styles.brand}>사귐</span>으로
            이어집니다. 취향이 닿는 모임을 찾고, 이야기를 나누고, 실시간으로
            소통해 보세요.
          </p>
          <div className={styles.actions}>
            <Link to="/sign-up" className={`${styles.btn} btn btn-primary btn-lg`}>
              지금 시작하기
            </Link>
            <Link to="/login" className={`${styles.btn} btn btn-secondary btn-lg`}>
              로그인
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

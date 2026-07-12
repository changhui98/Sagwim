import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MobileHeader } from '../components/MobileHeader'
import groupIcon from '../assets/moim-icon-2-three-people.svg'
import postIcon from '../assets/clipboard-list-alt-svgrepo-com.svg'
import styles from './CreateSelectPage.module.css'

/**
 * "만들기" 진입 시 모임/게시글 중 무엇을 만들지 고르는 전용 페이지.
 * 기존 CreateTypeSelectorModal(오버레이)을 대체하며, 헤더·푸터를 유지한 채 표시된다.
 */
export function CreateSelectPage() {
  const { meRole } = useAuth()
  const handleLogout = useLogout()

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <Header role={meRole} onLogout={handleLogout} />
      <MobileHeader />

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>무엇을 만들까요?</h1>
          <p className={styles.heroSubtitle}>모임을 열거나, 이야기를 나눠보세요</p>
        </div>

        <div className={styles.cardGrid}>
          <Link to="/app/groups/new" className={styles.card}>
            <span className={styles.iconWrap}>
              <img src={groupIcon} alt="" className={styles.icon} aria-hidden="true" />
            </span>
            <span className={styles.cardLabel}>모임</span>
            <span className={styles.cardDesc}>새로운 모임을 개설해보세요</span>
            <span className={styles.cardCta} aria-hidden="true">
              시작하기
              <svg
                className={styles.cardCtaArrow}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>

          <Link to="/app/posts/new" className={styles.card}>
            <span className={styles.iconWrap}>
              <img src={postIcon} alt="" className={styles.icon} aria-hidden="true" />
            </span>
            <span className={styles.cardLabel}>게시글</span>
            <span className={styles.cardDesc}>자유롭게 글을 작성해보세요</span>
            <span className={styles.cardCta} aria-hidden="true">
              시작하기
              <svg
                className={styles.cardCtaArrow}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

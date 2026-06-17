import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MobileHeader } from '../components/MobileHeader'
import styles from './ServiceHomePage.module.css'

/**
 * 사귐 서비스 소개 홈. 현재는 개편 중이라 헤더·푸터만 두고
 * 본문 가운데에 "서비스 개편 중" 안내만 노출한다.
 */
export function ServiceHomePage() {
  const { meRole } = useAuth()
  const handleLogout = useLogout()

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <Header role={meRole} onLogout={handleLogout} />
      <MobileHeader onLogout={handleLogout} />

      <main className={styles.main}>
        <div className={styles.notice}>
          <p className={styles.title}>
            <span className={styles.brand}>사귐</span>을 새롭게 단장하고 있어요
          </p>
          <p className={styles.subtitle}>
            더 좋은 모습으로 곧 찾아올게요. 조금만 기다려 주세요.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}

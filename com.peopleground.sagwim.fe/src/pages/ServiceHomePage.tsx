import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MobileHeader } from '../components/MobileHeader'
import { HeroSection } from '../components/landing/HeroSection'
import { ValueSection } from '../components/landing/ValueSection'
import { FeaturesSection } from '../components/landing/FeaturesSection'
import { HowItWorksSection } from '../components/landing/HowItWorksSection'
import { CtaSection } from '../components/landing/CtaSection'
import styles from './ServiceHomePage.module.css'

/**
 * 사귐 서비스 소개 홈. 스크롤하며 서비스를 이해할 수 있는 랜딩 페이지.
 * 히어로(한반도 연결 비주얼) → 가치 → 핵심 기능(모임·게시판·채팅)
 * → 사용 흐름 → 가입 CTA 순으로 구성한다.
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
        <HeroSection />
        <ValueSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}

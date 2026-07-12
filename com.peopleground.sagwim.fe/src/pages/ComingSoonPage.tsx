import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MobileHeader } from '../components/MobileHeader'
import { EmptyState } from '../components/common/EmptyState'
import styles from './ComingSoonPage.module.css'

interface ComingSoonPageProps {
  title: string
}

/**
 * 아직 구현되지 않은 메뉴(회사 소개·공지사항·고객센터 등)를
 * 헤더·푸터는 유지한 채 본문에 "준비 중" 안내만 보여주는 공통 페이지.
 * 라우트별로 `title`만 바꿔 재사용한다.
 */
export function ComingSoonPage({ title }: ComingSoonPageProps) {
  const { meRole } = useAuth()
  const handleLogout = useLogout()

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <Header role={meRole} onLogout={handleLogout} />
      <MobileHeader />

      <main className={styles.main}>
        <EmptyState
          title={`${title} 기능을 준비 중입니다.`}
          description="더 좋은 모습으로 곧 찾아올게요. 조금만 기다려 주세요."
        />
      </main>
      <Footer />
    </>
  )
}

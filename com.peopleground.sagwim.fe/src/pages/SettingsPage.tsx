import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { MobileHeader } from '../components/MobileHeader'
import { Footer } from '../components/Footer'
import { ShieldIcon, UserCircleIcon, SettingsIcon } from '../components/NavIcons'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { meRole } = useAuth()
  useHandleUnauthorized()
  const handleLogout = useLogout()

  // 설정 영역(개요/하위 폼) 어디에 있든 "계정 보안" 카테고리는 항상 활성
  const isActive = pathname.startsWith('/app/settings')

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <Header role={meRole} onLogout={handleLogout} />
      <MobileHeader onLogout={handleLogout} />

      <main className={styles.main}>
        {/* ── 히어로 배너 ── */}
        <header className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroIconWrap} aria-hidden="true">
              <SettingsIcon width={28} height={28} />
            </div>
            <div>
              <p className={styles.heroEyebrow}>내 계정</p>
              <h1 className={styles.heroTitle}>설정</h1>
              <p className={styles.heroSubtitle}>계정과 보안을 관리하세요</p>
            </div>
          </div>
        </header>

        {/* ── 본문: 좌측 탭 + 우측 콘텐츠(Outlet) ── */}
        <div className={styles.layout}>
          <nav className={styles.sidebar} aria-label="설정 카테고리">
            <p className={styles.sidebarHeading}>메뉴</p>
            <ul className={styles.tabList} role="tablist">
              <li role="none">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={isActive ? styles.tabItemActive : styles.tabItem}
                  onClick={() => navigate('/app/settings')}
                >
                  <span className={styles.tabIcon} aria-hidden="true">
                    <ShieldIcon width={18} height={18} />
                  </span>
                  <span className={styles.tabLabel}>계정 보안</span>
                  {isActive && <span className={styles.tabActiveIndicator} aria-hidden="true" />}
                </button>
              </li>
            </ul>

            <div className={styles.sidebarFooter}>
              <UserCircleIcon width={14} height={14} />
              <span>개인 설정</span>
            </div>
          </nav>

          <div className={styles.content}>
            <Outlet />
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
